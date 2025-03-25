// This script adds a user as an admin
// Usage: node add-admin.js YOUR_USER_ID

const { createClient } = require('@supabase/supabase-js');

// Replace these with your actual Supabase URL and service role key
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addAdmin(userId) {
  if (!userId) {
    console.error('Error: Please provide a user ID as an argument');
    console.log('Usage: node add-admin.js YOUR_USER_ID');
    process.exit(1);
  }

  try {
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .auth
      .admin
      .getUserById(userId);

    if (userError) {
      console.error('Error checking if user exists:', userError.message);
      process.exit(1);
    }

    if (!user) {
      console.error(`User with ID ${userId} not found`);
      process.exit(1);
    }

    // Check if already an admin
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingAdmin) {
      console.log(`User ${userId} is already an admin`);
      process.exit(0);
    }

    // Add user as admin
    const { data, error } = await supabase
      .from('admins')
      .insert([{ user_id: userId }]);

    if (error) {
      console.error('Error adding admin:', error.message);
      process.exit(1);
    }

    console.log(`User ${userId} has been added as an admin successfully!`);
  } catch (error) {
    console.error('Unexpected error:', error.message);
    process.exit(1);
  }
}

// Get the user ID from command line arguments
const userId = process.argv[2];
addAdmin(userId); 