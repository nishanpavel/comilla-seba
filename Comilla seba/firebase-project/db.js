// Database Functions for Firestore
class DatabaseManager {
    constructor() {
        this.db = firebase.firestore();
    }

    // Categories Management
    async getCategories() {
        try {
            const snapshot = await this.db.collection('pavel00').doc('categories').collection('data').get();
            const categories = [];
            snapshot.forEach((doc) => {
                categories.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, data: categories };
        } catch (error) {
            console.error('Error getting categories:', error);
            return { success: false, error: error.message };
        }
    }

    async addCategory(categoryData) {
        try {
            const docRef = await this.db.collection('pavel00').doc('categories').collection('data').add({
                ...categoryData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Category added with ID:', docRef.id);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error adding category:', error);
            return { success: false, error: error.message };
        }
    }

    // Providers Management
    async getProviders(filters = {}) {
        try {
            let query = this.db.collection('pavel00').doc('providers').collection('data');
            
            // Apply filters
            if (filters.category) {
                query = query.where('category', 'array-contains', filters.category);
            }
            if (filters.location) {
                query = query.where('location', '==', filters.location);
            }
            if (filters.isApproved !== undefined) {
                query = query.where('isApproved', '==', filters.isApproved);
            }
            if (filters.minRating) {
                query = query.where('rating', '>=', filters.minRating);
            }

            // Order by rating and limit
            query = query.orderBy('rating', 'desc').limit(50);

            const snapshot = await query.get();
            const providers = [];
            snapshot.forEach((doc) => {
                providers.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, data: providers };
        } catch (error) {
            console.error('Error getting providers:', error);
            return { success: false, error: error.message };
        }
    }

    async getProviderById(providerId) {
        try {
            const doc = await this.db.collection('pavel00').doc('providers').collection('data').doc(providerId).get();
            if (doc.exists) {
                return { success: true, data: { id: doc.id, ...doc.data() } };
            } else {
                return { success: false, error: 'Provider not found' };
            }
        } catch (error) {
            console.error('Error getting provider:', error);
            return { success: false, error: error.message };
        }
    }

    async addProvider(providerData) {
        try {
            const docRef = await this.db.collection('pavel00').doc('providers').collection('data').add({
                ...providerData,
                isApproved: false, // New providers need admin approval
                rating: 0,
                reviewCount: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Provider added with ID:', docRef.id);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error adding provider:', error);
            return { success: false, error: error.message };
        }
    }

    async updateProvider(providerId, updateData) {
        try {
            await this.db.collection('pavel00').doc('providers').collection('data').doc(providerId).update({
                ...updateData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Provider updated successfully');
            return { success: true };
        } catch (error) {
            console.error('Error updating provider:', error);
            return { success: false, error: error.message };
        }
    }

    async approveProvider(providerId) {
        return this.updateProvider(providerId, { isApproved: true });
    }

    async rejectProvider(providerId) {
        try {
            await this.db.collection('pavel00').doc('providers').collection('data').doc(providerId).delete();
            console.log('Provider rejected and deleted');
            return { success: true };
        } catch (error) {
            console.error('Error rejecting provider:', error);
            return { success: false, error: error.message };
        }
    }

    // Users Management
    async getUserById(userId) {
        try {
            const doc = await this.db.collection('pavel00').doc('users').collection('data').doc(userId).get();
            if (doc.exists) {
                return { success: true, data: { id: doc.id, ...doc.data() } };
            } else {
                return { success: false, error: 'User not found' };
            }
        } catch (error) {
            console.error('Error getting user:', error);
            return { success: false, error: error.message };
        }
    }

    async updateUser(userId, updateData) {
        try {
            await this.db.collection('pavel00').doc('users').collection('data').doc(userId).update({
                ...updateData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('User updated successfully');
            return { success: true };
        } catch (error) {
            console.error('Error updating user:', error);
            return { success: false, error: error.message };
        }
    }

    // Reviews Management
    async addReview(providerId, reviewData) {
        try {
            // Add review to reviews subcollection
            const reviewRef = await this.db
                .collection('pavel00')
                .doc('providers')
                .collection('data')
                .doc(providerId)
                .collection('reviews')
                .add({
                    ...reviewData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            // Update provider's rating and review count
            await this.updateProviderRating(providerId);

            console.log('Review added with ID:', reviewRef.id);
            return { success: true, id: reviewRef.id };
        } catch (error) {
            console.error('Error adding review:', error);
            return { success: false, error: error.message };
        }
    }

    async getProviderReviews(providerId) {
        try {
            const snapshot = await this.db
                .collection('pavel00')
                .doc('providers')
                .collection('data')
                .doc(providerId)
                .collection('reviews')
                .orderBy('createdAt', 'desc')
                .get();

            const reviews = [];
            snapshot.forEach((doc) => {
                reviews.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, data: reviews };
        } catch (error) {
            console.error('Error getting reviews:', error);
            return { success: false, error: error.message };
        }
    }

    // Update provider rating based on reviews
    async updateProviderRating(providerId) {
        try {
            const reviewsSnapshot = await this.db
                .collection('pavel00')
                .doc('providers')
                .collection('data')
                .doc(providerId)
                .collection('reviews')
                .get();

            let totalRating = 0;
            let reviewCount = 0;

            reviewsSnapshot.forEach((doc) => {
                totalRating += doc.data().rating;
                reviewCount++;
            });

            const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;

            await this.db
                .collection('pavel00')
                .doc('providers')
                .collection('data')
                .doc(providerId)
                .update({
                    rating: averageRating,
                    reviewCount: reviewCount,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            return { success: true };
        } catch (error) {
            console.error('Error updating provider rating:', error);
            return { success: false, error: error.message };
        }
    }

    // Real-time listeners
    onProvidersChange(callback, filters = {}) {
        let query = this.db.collection('pavel00').doc('providers').collection('data');
        
        // Apply filters
        if (filters.category) {
            query = query.where('category', 'array-contains', filters.category);
        }
        if (filters.location) {
            query = query.where('location', '==', filters.location);
        }
        if (filters.isApproved !== undefined) {
            query = query.where('isApproved', '==', filters.isApproved);
        }

        return query.onSnapshot((snapshot) => {
            const providers = [];
            snapshot.forEach((doc) => {
                providers.push({ id: doc.id, ...doc.data() });
            });
            callback(providers);
        }, (error) => {
            console.error('Error in providers listener:', error);
        });
    }

    onCategoriesChange(callback) {
        return this.db
            .collection('pavel00')
            .doc('categories')
            .collection('data')
            .where('isActive', '==', true)
            .onSnapshot((snapshot) => {
                const categories = [];
                snapshot.forEach((doc) => {
                    categories.push({ id: doc.id, ...doc.data() });
                });
                callback(categories);
            }, (error) => {
                console.error('Error in categories listener:', error);
            });
    }
}

// Initialize Database Manager
const dbManager = new DatabaseManager();