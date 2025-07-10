// test-supabase.js
const supabase = require('./config/supabase');

async function testConnection() {
    try {
        console.log('Testing Supabase connection...');
        console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
        console.log('Has service key:', !!process.env.SUPABASE_SERVICE_KEY);
        
        // Test database connection
        const { data, error } = await supabase
            .from('cases')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('Database error:', error);
            return;
        }
        
        console.log('✅ Database connection successful!');
        console.log('Cases in database:', data.length);
        
        // Test storage connection
        const { data: buckets, error: storageError } = await supabase
            .storage
            .listBuckets();
            
        if (storageError) {
            console.error('Storage error:', storageError);
            return;
        }
        
        console.log('✅ Storage connection successful!');
        console.log('Available buckets:', buckets.map(b => b.name));
        
        console.log('\n🎉 Supabase is ready to use!');
        
    } catch (error) {
        console.error('Connection failed:', error.message);
    }
}

testConnection();