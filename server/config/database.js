const mongoose = require('mongoose');
const env = require('./env');

let usingMemoryStore = false;
const memoryStore = require("../dev/memoryStore");

const maskMongoUri = (uri) => uri.replace(/\/\/([^@/]+)@/, "//***@");

const connect = async () => {
    try {
        await mongoose.connect(env.mongoUri, {
            serverSelectionTimeoutMS: 5000
        });
        usingMemoryStore = false;
        memoryStore.disable();
        console.log(`MongoDB connected (${maskMongoUri(env.mongoUri)})`);
        try {
            const { seedDatabase } = require("../modules/data/seed");
            const result = await seedDatabase();
            if (result.seeded) {
                console.log(`Platform data seeded (${result.mode})`);
            }
        } catch (seedError) {
            console.warn("Platform data seed skipped:", seedError.message);
        }
        return true;
    } catch (err) {
        console.log('Database connection failed');
        console.log(err.message );
        console.log(err);
        // Fallback to memory store only when MongoDB is unavailable (development)
        if (env.nodeEnv === 'development') {
            console.warn('Falling back to in-memory store for development');
            memoryStore.enable();
            usingMemoryStore = true;
            try {
                const { seedDatabase } = require("../modules/data/seed");
                const result = await seedDatabase();
                if (result.seeded) {
                    console.log(`Platform data seeded (${result.mode})`);
                }
            } catch (seedError) {
                console.warn("Platform data seed skipped:", seedError.message);
            }
            return false;
        } else {
            process.exit(1);
        }
    }
};

const isDatabaseConnected = () => {
    return mongoose.connection.readyState === 1 && !usingMemoryStore;
};

const isUsingMemoryStore = () => {
    // Memory store is only allowed when MongoDB is unavailable
    if (isDatabaseConnected()) {
        return false;
    }
    return usingMemoryStore && memoryStore.isActive();
};

module.exports = {
    connect,
    isDatabaseConnected,
    isUsingMemoryStore
};