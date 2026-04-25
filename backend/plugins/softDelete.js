/**
 * Soft Delete Plugin for Mongoose
 * Adds deletedAt and deletedBy fields and modifies queries to exclude deleted documents
 */

const softDeletePlugin = (schema) => {
    // Add soft delete fields
    schema.add({
        deletedAt: {
            type: Date,
            default: null
        },
        deletedBy: {
            type: schema.path('_id') ? schema.path('_id').constructor : String,
            ref: 'User',
            default: null
        }
    });

    // Add index for better query performance
    schema.index({ deletedAt: 1 });

    // Modify find queries to exclude deleted documents by default
    const excludeDeleted = function (next) {
        if (!this.getQuery().deletedAt) {
            this.where({ deletedAt: null });
        }
        next();
    };

    schema.pre('find', excludeDeleted);
    schema.pre('findOne', excludeDeleted);
    schema.pre('findOneAndUpdate', excludeDeleted);
    schema.pre('count', excludeDeleted);
    schema.pre('countDocuments', excludeDeleted);

    // Instance method to soft delete
    schema.methods.softDelete = function (userId = null) {
        this.deletedAt = new Date();
        this.deletedBy = userId;
        return this.save();
    };

    // Instance method to restore
    schema.methods.restore = function () {
        this.deletedAt = null;
        this.deletedBy = null;
        return this.save();
    };

    // Instance method to check if deleted
    schema.methods.isDeleted = function () {
        return this.deletedAt !== null;
    };

    // Static method to find deleted documents
    schema.statics.findDeleted = function (conditions = {}) {
        return this.find({ ...conditions, deletedAt: { $ne: null } });
    };

    // Static method to find with deleted documents
    schema.statics.findWithDeleted = function (conditions = {}) {
        return this.find(conditions);
    };

    // Static method to soft delete by ID
    schema.statics.softDeleteById = async function (id, userId = null) {
        const doc = await this.findById(id);
        if (!doc) {
            throw new Error('Document not found');
        }
        return doc.softDelete(userId);
    };

    // Static method to restore by ID
    schema.statics.restoreById = async function (id) {
        const doc = await this.findOne({ _id: id, deletedAt: { $ne: null } });
        if (!doc) {
            throw new Error('Deleted document not found');
        }
        return doc.restore();
    };

    // Static method to permanently delete
    schema.statics.forceDelete = function (conditions) {
        return this.deleteOne(conditions);
    };

    // Static method to permanently delete by ID
    schema.statics.forceDeleteById = function (id) {
        return this.deleteOne({ _id: id });
    };
};

module.exports = softDeletePlugin;
