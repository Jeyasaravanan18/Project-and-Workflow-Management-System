/**
 * Pagination utility for consistent API responses
 */

/**
 * Parse pagination parameters from request query
 */
const parsePaginationParams = (query) => {
    const page = parseInt(query.page) || 1;
    const limit = Math.min(parseInt(query.limit) || 20, 100); // Max 100 items per page
    const skip = (page - 1) * limit;
    const sort = query.sort || '-createdAt'; // Default: newest first

    return { page, limit, skip, sort };
};

/**
 * Build pagination response
 */
const buildPaginationResponse = (data, total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage,
            hasPrevPage,
            nextPage: hasNextPage ? page + 1 : null,
            prevPage: hasPrevPage ? page - 1 : null
        }
    };
};

/**
 * Apply pagination to Mongoose query
 */
const applyPagination = async (query, Model, page, limit, skip, sort) => {
    const [data, total] = await Promise.all([
        query.limit(limit).skip(skip).sort(sort),
        Model.countDocuments(query.getFilter())
    ]);

    return buildPaginationResponse(data, total, page, limit);
};

/**
 * Cursor-based pagination for large datasets
 */
const buildCursorQuery = (cursor, sortField = '_id') => {
    if (!cursor) return {};

    try {
        const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
        const cursorData = JSON.parse(decodedCursor);

        return {
            [sortField]: { $lt: cursorData[sortField] }
        };
    } catch (error) {
        return {};
    }
};

/**
 * Generate cursor from document
 */
const generateCursor = (doc, sortField = '_id') => {
    if (!doc) return null;

    const cursorData = {
        [sortField]: doc[sortField]
    };

    return Buffer.from(JSON.stringify(cursorData)).toString('base64');
};

/**
 * Build cursor-based pagination response
 */
const buildCursorResponse = (data, limit, sortField = '_id') => {
    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, -1) : data;
    const nextCursor = hasMore ? generateCursor(data[limit - 1], sortField) : null;

    return {
        data: items,
        pagination: {
            nextCursor,
            hasMore,
            limit
        }
    };
};

module.exports = {
    parsePaginationParams,
    buildPaginationResponse,
    applyPagination,
    buildCursorQuery,
    generateCursor,
    buildCursorResponse
};
