const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

// Initialize Bedrock client with support for both local keys and IAM roles
const clientConfig = {
    region: process.env.AWS_REGION || 'us-east-1'
};

// Only add explicit credentials if they exist in env (Local Dev)
// Otherwise, let AWS SDK use the default provider chain (IAM Roles on AWS)
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    };
}

const bedrockClient = new BedrockRuntimeClient(clientConfig);

// Simple in-memory cache (5 minutes)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Generate AI recommendations for workflow bottlenecks
 * @param {Object} bottleneckData - Data about stuck tasks and stages
 * @returns {Promise<Array>} Array of AI-generated recommendations
 */
const generateBottleneckRecommendations = async (bottleneckData) => {
    try {
        const { stuckTaskCount, stageAnalysis, stuckTasks } = bottleneckData;

        // If no bottlenecks, return empty recommendations
        if (stuckTaskCount === 0) {
            return [];
        }

        // Create cache key from data
        const cacheKey = JSON.stringify({ stuckTaskCount, stageAnalysis });

        // Check cache
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log('[AI Service] Returning cached recommendations');
            return cached.recommendations;
        }

        // Prepare context for AI
        const topStages = Object.entries(stageAnalysis)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([stage, count]) => `${stage}: ${count} tasks`)
            .join(', ');

        const topTasks = stuckTasks
            .slice(0, 5)
            .map(t => `"${t.title}" (${t.daysStuck} days in ${t.stage})`)
            .join(', ');

        // Craft prompt for Bedrock
        const prompt = `You are a workflow optimization expert analyzing project bottlenecks.

Current Situation:
- ${stuckTaskCount} tasks are stuck (no updates for 3+ days)
- Most affected stages: ${topStages}
- Sample stuck tasks: ${topTasks}

Provide exactly 3 specific, actionable recommendations to resolve these bottlenecks. Each recommendation should:
1. Target a specific problem
2. Suggest a concrete action
3. Be brief (1-2 sentences)

Format your response as a JSON array of objects with "title" and "description" fields.
Example: [{"title": "Redistribute workload", "description": "Move 3 tasks from Review stage to available team members."}]

Respond ONLY with the JSON array, no other text.`;

        // Call Bedrock API
        const input = {
            modelId: process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0',
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
                messages: [
                    {
                        role: 'user',
                        content: [{ text: prompt }]
                    }
                ],
                inferenceConfig: {
                    maxTokens: 500,
                    temperature: 0.7,
                    topP: 0.9
                }
            })
        };

        const command = new InvokeModelCommand(input);
        const response = await bedrockClient.send(command);

        // Parse response
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        const aiText = responseBody.output?.message?.content?.[0]?.text || '';

        console.log('[AI Service] Raw AI response:', aiText);

        // Extract JSON from response
        let recommendations = [];
        try {
            // Try to parse as JSON directly
            const jsonMatch = aiText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                recommendations = JSON.parse(jsonMatch[0]);
            } else {
                // Fallback: parse the entire response
                recommendations = JSON.parse(aiText);
            }

            // Validate structure
            if (!Array.isArray(recommendations)) {
                throw new Error('Response is not an array');
            }

            // Ensure we have exactly 3 recommendations
            recommendations = recommendations.slice(0, 3);

        } catch (parseError) {
            console.error('[AI Service] Failed to parse AI response:', parseError);
            // Return fallback recommendations
            recommendations = generateFallbackRecommendations(stageAnalysis, stuckTaskCount);
        }

        // Cache the result
        cache.set(cacheKey, {
            recommendations,
            timestamp: Date.now()
        });

        console.log('[AI Service] Generated recommendations:', recommendations.length);
        return recommendations;

    } catch (error) {
        console.error('[AI Service] Error generating recommendations:', error);
        // Return fallback recommendations on error
        return generateFallbackRecommendations(bottleneckData.stageAnalysis, bottleneckData.stuckTaskCount);
    }
};

/**
 * Generate fallback recommendations when AI fails
 */
const generateFallbackRecommendations = (stageAnalysis, stuckTaskCount) => {
    const topStages = Object.entries(stageAnalysis)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    return topStages.map(([stage, count]) => ({
        title: `Optimize "${stage}" Stage`,
        description: `${count} tasks (${((count / stuckTaskCount) * 100).toFixed(1)}% of delays) are stuck here. Consider adding resources or reviewing process bottlenecks.`
    }));
};

/**
 * Retrieve relevant documents based on user query
 * @param {String} query - User's question
 * @param {ObjectId} organizationId - Organization ID for data isolation
 * @param {Number} limit - Maximum number of documents to retrieve
 * @returns {Promise<Array>} Array of relevant documents
 */
const retrieveRelevantDocuments = async (query, organizationId, limit = 5) => {
    try {
        const KnowledgeDocument = require('../models/KnowledgeDocument');

        // Extract keywords from query (simple approach)
        const keywords = query
            .toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 3 && !['what', 'how', 'why', 'when', 'where', 'which', 'that', 'this', 'with', 'from', 'have', 'been'].includes(word));

        console.log('[AI Service] Search keywords:', keywords);

        // Build search query
        const searchQuery = {
            organizationId,
            status: 'published',
            $or: []
        };

        // Add text search if keywords exist
        if (keywords.length > 0) {
            const keywordRegex = keywords.join('|');
            searchQuery.$or.push(
                { title: { $regex: keywordRegex, $options: 'i' } },
                { content: { $regex: keywordRegex, $options: 'i' } },
                { tags: { $in: keywords } }
            );
        } else {
            // If no keywords, search all published documents
            delete searchQuery.$or;
        }

        // Retrieve documents
        const documents = await KnowledgeDocument.find(searchQuery)
            .select('title type content summary tags metadata')
            .sort({ 'metadata.viewCount': -1, 'metadata.helpfulCount': -1, createdAt: -1 })
            .limit(limit)
            .lean();

        console.log(`[AI Service] Retrieved ${documents.length} documents`);

        // Increment view count for retrieved documents (async, don't wait)
        documents.forEach(doc => {
            KnowledgeDocument.findByIdAndUpdate(doc._id, { $inc: { 'metadata.viewCount': 1 } }).catch(err => {
                console.error('[AI Service] Error updating view count:', err);
            });
        });

        return documents;

    } catch (error) {
        console.error('[AI Service] Error retrieving documents:', error);
        return [];
    }
};

/**
 * Generate AI assistant response with RAG
 * @param {String} userMessage - User's question
 * @param {Array} conversationHistory - Previous messages for context
 * @param {ObjectId} organizationId - Organization ID
 * @returns {Promise<Object>} AI response with citations
 */
const generateAssistantResponse = async (userMessage, conversationHistory = [], organizationId) => {
    try {
        const startTime = Date.now();

        // 1. Retrieve relevant documents
        const relevantDocs = await retrieveRelevantDocuments(userMessage, organizationId, 5);

        // 2. Build context from documents
        let context = '';
        if (relevantDocs.length > 0) {
            context = 'RELEVANT KNOWLEDGE BASE DOCUMENTS:\n\n';
            relevantDocs.forEach((doc, idx) => {
                // Truncate long content to save tokens
                const truncatedContent = doc.content.length > 800
                    ? doc.content.substring(0, 800) + '...'
                    : doc.content;

                context += `[DOCUMENT ${idx + 1}] ${doc.type.toUpperCase()}: ${doc.title}\n`;
                if (doc.summary) {
                    context += `Summary: ${doc.summary}\n`;
                }
                context += `${truncatedContent}\n\n---\n\n`;
            });
        }

        // 3. Build conversation history
        let historyText = '';
        if (conversationHistory.length > 0) {
            historyText = 'CONVERSATION HISTORY:\n';
            conversationHistory.slice(-6).forEach(msg => { // Last 6 messages for context
                historyText += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
            });
            historyText += '\n';
        }

        // 4. Build system prompt
        const systemPrompt = `You are an IT Support AI Assistant for a Project & Workflow Management System. Your role is to help users with:
- Workflow and task management questions
- Troubleshooting technical issues
- Understanding analytics and reports
- Learning best practices
- Resolving incidents quickly

Guidelines:
1. Use the knowledge base documents provided to give accurate, grounded answers
2. Cite specific documents when referencing information (e.g., "According to the Database Timeout Runbook...")
3. Provide step-by-step guidance when appropriate
4. Be concise but thorough
5. If you don't know something, say so - don't make up information
6. Use a friendly, professional tone

${context}`;

        // 5. Build user prompt
        const userPrompt = `${historyText}User: ${userMessage}

Please provide a helpful response. If you use information from the knowledge base, cite the document name.`;

        // 6. Call Bedrock API
        const input = {
            modelId: process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0',
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
                messages: [
                    {
                        role: 'user',
                        content: [{ text: systemPrompt + '\n\n' + userPrompt }]
                    }
                ],
                inferenceConfig: {
                    maxTokens: 2000,
                    temperature: 0.3, // Lower temperature for more factual responses
                    topP: 0.9
                }
            })
        };

        const command = new InvokeModelCommand(input);
        const response = await bedrockClient.send(command);

        // 7. Parse response
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        const aiText = responseBody.output?.message?.content?.[0]?.text || 'I apologize, but I encountered an error generating a response.';

        const responseTime = Date.now() - startTime;

        console.log(`[AI Service] Generated response in ${responseTime}ms`);

        // 8. Build citations
        const citations = relevantDocs.map(doc => ({
            documentId: doc._id,
            title: doc.title,
            type: doc.type,
            excerpt: doc.summary || doc.content.substring(0, 150) + '...'
        }));

        return {
            content: aiText,
            citations,
            metadata: {
                model: process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0',
                responseTime,
                documentsRetrieved: relevantDocs.length
            }
        };

    } catch (error) {
        console.error('[AI Service] Error generating assistant response:', error);
        return {
            content: 'I apologize, but I encountered an error while processing your request. Please try again or contact support if the issue persists.',
            citations: [],
            metadata: {
                error: error.message
            }
        };
    }
};

/**
 * Generate an AI Sprint Plan from a list of tasks and team members
 * @param {Object} input - { tasks, members, sprintDurationWeeks, startDate }
 * @returns {Promise<Object>} Sprint plan with sprints, assignments, risk flags
 */
const generateSprintPlan = async ({ tasks, members, sprintDurationWeeks = 2, startDate }) => {
    try {
        const taskSummaries = tasks.map((t, i) =>
            `${i + 1}. "${t.title}" | Priority: ${t.priority} | Est: ${t.estimatedHours || '?'}h | Assignees: ${t.assignees?.join(', ') || 'Unassigned'} | Status: ${t.status || 'todo'}`
        ).join('\n');

        const memberSummaries = members.map(m =>
            `- ${m.name} (${m.role}) | Current load: ${m.activeTasks} active tasks`
        ).join('\n');

        const today = startDate || new Date().toISOString().split('T')[0];

        const prompt = `You are an expert Agile Sprint Planner for a software engineering team.

SPRINT CONTEXT:
- Sprint duration: ${sprintDurationWeeks} weeks
- Start date: ${today}
- Team capacity: assume 6 hours/day per person

AVAILABLE TASKS (${tasks.length} total):
${taskSummaries}

TEAM MEMBERS:
${memberSummaries}

Your job is to create an optimal sprint plan. Return a JSON object with:
{
  "summary": "2-sentence executive summary of the sprint plan",
  "totalPoints": number (sum of estimated hours),
  "teamCapacity": number (total available hours for the sprint),
  "utilizationPct": number (0-100),
  "riskLevel": "low" | "medium" | "high",
  "risks": ["risk 1", "risk 2"],
  "sprints": [
    {
      "name": "Sprint 1",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "goal": "1 sentence sprint goal",
      "tasks": [
        {
          "taskTitle": "title from input",
          "priority": "high|medium|low|critical",
          "estimatedHours": number,
          "assignedTo": "member name",
          "reason": "one sentence why this task goes here and to this person"
        }
      ]
    }
  ],
  "unscheduled": ["task title 1", "task title 2"],
  "recommendations": ["action 1", "action 2", "action 3"]
}

Rules:
- Prioritize critical and high priority tasks in Sprint 1
- Balance workload across team members based on their current load
- Group related tasks in the same sprint for context switching efficiency
- Leave 20% buffer per person per sprint for meetings/reviews
- If tasks exceed capacity, put them in unscheduled
- Keep each sprint focused on a coherent goal

Respond ONLY with the JSON object, no other text.`;

        const input = {
            modelId: process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0',
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
                messages: [{ role: 'user', content: [{ text: prompt }] }],
                inferenceConfig: { maxTokens: 2000, temperature: 0.4, topP: 0.9 }
            })
        };

        const command = new InvokeModelCommand(input);
        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        const aiText = responseBody.output?.message?.content?.[0]?.text || '';

        console.log('[AI Service] Sprint plan raw response:', aiText.substring(0, 200));

        let plan = {};
        try {
            const jsonMatch = aiText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                plan = JSON.parse(jsonMatch[0]);
            } else {
                plan = JSON.parse(aiText);
            }
        } catch (parseError) {
            console.error('[AI Service] Sprint plan parse error:', parseError);
            plan = generateFallbackSprintPlan(tasks, members, sprintDurationWeeks, today);
        }

        return plan;

    } catch (error) {
        console.error('[AI Service] Sprint plan generation error:', error);
        return generateFallbackSprintPlan(tasks, members, sprintDurationWeeks, startDate);
    }
};

/**
 * Fallback sprint plan when AI is unavailable
 */
const generateFallbackSprintPlan = (tasks, members, sprintDurationWeeks, startDate) => {
    const sorted = [...tasks].sort((a, b) => {
        const pOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return (pOrder[a.priority] || 2) - (pOrder[b.priority] || 2);
    });

    const hoursPerSprint = members.length * 6 * 5 * sprintDurationWeeks * 0.8;
    let used = 0;
    const sprint1Tasks = [];
    const unscheduled = [];

    sorted.forEach(t => {
        const hours = t.estimatedHours || 4;
        if (used + hours <= hoursPerSprint) {
            const member = members[sprint1Tasks.length % Math.max(members.length, 1)];
            sprint1Tasks.push({
                taskTitle: t.title,
                priority: t.priority || 'medium',
                estimatedHours: hours,
                assignedTo: member?.name || 'Unassigned',
                reason: `Priority: ${t.priority || 'medium'}. Assigned for balanced workload distribution.`
            });
            used += hours;
        } else {
            unscheduled.push(t.title);
        }
    });

    const start = new Date(startDate || Date.now());
    const end = new Date(start);
    end.setDate(end.getDate() + sprintDurationWeeks * 7);

    return {
        summary: `Auto-generated sprint plan for ${tasks.length} tasks across ${members.length} team members. AI service unavailable — using priority-based assignment.`,
        totalPoints: used,
        teamCapacity: hoursPerSprint,
        utilizationPct: Math.round((used / hoursPerSprint) * 100),
        riskLevel: unscheduled.length > 0 ? 'medium' : 'low',
        risks: unscheduled.length > 0 ? [`${unscheduled.length} tasks exceed sprint capacity and were not scheduled`] : [],
        sprints: [{
            name: 'Sprint 1',
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            goal: `Complete ${sprint1Tasks.length} highest-priority tasks`,
            tasks: sprint1Tasks
        }],
        unscheduled,
        recommendations: [
            'Break tasks > 8 hours into smaller subtasks',
            'Assign critical tasks first to reduce project risk',
            'Reserve 20% buffer for code reviews and meetings'
        ]
    };
};

/**
 * Generate an AI Project Structure (Scaffold) from a plain text description
 * @param {String} description - Description of the project to build
 * @returns {Promise<Object>} Scaffolded project with modules and tasks
 */
const generateProjectStructure = async (description) => {
    try {
        const prompt = `You are an expert Technical Project Manager and Systems Architect.
Your job is to break down a high-level project description into a structured plan consisting of Modules (epics/milestones) and Tasks.

PROJECT DESCRIPTION:
"${description}"

Return a JSON object with:
{
  "summary": "1-2 sentence summary of what is being built",
  "modules": [
    {
      "name": "Module Name (e.g., Authentication, Database Setup)",
      "description": "Brief description of the module's goal",
      "tasks": [
        {
          "title": "Actionable task title",
          "description": "Detailed description of what needs to be done",
          "priority": "critical" | "high" | "medium" | "low",
          "estimatedHours": number (realistic estimate, usually 1-16)
        }
      ]
    }
  ]
}

Rules:
- Create 3-6 logical modules.
- Create 3-8 tasks per module.
- Keep titles concise but descriptive.
- Respond ONLY with the JSON object, no other text or explanation.`;

        const input = {
            modelId: process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0',
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
                messages: [{ role: 'user', content: [{ text: prompt }] }],
                inferenceConfig: { maxTokens: 4000, temperature: 0.5, topP: 0.9 }
            })
        };

        const command = new InvokeModelCommand(input);
        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        const aiText = responseBody.output?.message?.content?.[0]?.text || '';

        console.log('[AI Service] Project scaffold raw response length:', aiText.length);

        let plan = {};
        try {
            const jsonMatch = aiText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                plan = JSON.parse(jsonMatch[0]);
            } else {
                plan = JSON.parse(aiText);
            }
        } catch (parseError) {
            console.error('[AI Service] Project scaffold parse error:', parseError);
            throw new Error('Failed to parse AI response into valid JSON structure.');
        }

        return plan;

    } catch (error) {
        console.error('[AI Service] Project scaffold generation error:', error);
        throw error;
    }
};

module.exports = {
    generateBottleneckRecommendations,
    retrieveRelevantDocuments,
    generateAssistantResponse,
    generateSprintPlan,
    generateProjectStructure
};
