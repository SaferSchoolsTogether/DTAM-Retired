#!/usr/bin/env node

/**
 * Bootstrap Script: Create Admin User
 * 
 * This script creates the first admin user in the Supabase database.
 * It uses the Supabase service key to bypass authentication requirements.
 * 
 * Usage:
 *   node scripts/create-admin-user.js <email> <password> [full_name] [organization]
 * 
 * Example:
 *   node scripts/create-admin-user.js admin@example.com SecurePassword123 "Admin User" "School District"
 */

// Load environment variables
require('dotenv').config();

// Import Supabase client with service key
const supabase = require('../config/supabase');

// Validate command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Error: Email and password are required');
  console.log('Usage: node scripts/create-admin-user.js <email> <password> [full_name] [organization]');
  process.exit(1);
}

// Extract arguments
const email = args[0];
const password = args[1];
const fullName = args[2] || 'System Administrator';
const organization = args[3] || 'DTAM System';

// Validate email format
if (!email.includes('@') || !email.includes('.')) {
  console.error('Error: Invalid email format');
  process.exit(1);
}

// Validate password strength
if (password.length < 8) {
  console.error('Error: Password must be at least 8 characters long');
  process.exit(1);
}

// Create admin user
async function createAdminUser() {
  try {
    console.log(`Creating admin user: ${email}`);
    
    // Step 1: Create the user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        organization: organization,
        role: 'admin'
      }
    });

    if (authError) {
      console.error('Error creating user in auth system:', authError.message);
      process.exit(1);
    }

    console.log('User created successfully in auth system');
    console.log(`User ID: ${authUser.user.id}`);

    // Step 2: Verify the profile was created via trigger
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    if (profileError) {
      console.error('Error verifying user profile:', profileError.message);
      console.log('Attempting to create profile manually...');
      
      // Create profile manually if the trigger didn't work
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email: email,
          full_name: fullName,
          organization: organization,
          role: 'admin',
          is_active: true,
          last_login: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('Error creating profile manually:', insertError.message);
        process.exit(1);
      }
      
      console.log('Profile created manually');
    } else {
      console.log('Profile created automatically via trigger');
      
      // Ensure role is set to admin
      if (profile.role !== 'admin') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', authUser.user.id);
          
        if (updateError) {
          console.error('Error updating role to admin:', updateError.message);
        } else {
          console.log('Role updated to admin');
        }
      }
    }

    // Step 3: Verify permissions were granted via trigger
    const { data: permissions, error: permissionsError } = await supabase
      .from('user_permissions')
      .select('permission')
      .eq('user_id', authUser.user.id);

    if (permissionsError || !permissions || permissions.length === 0) {
      console.error('Error verifying permissions or no permissions found');
      console.log('Granting admin permissions manually...');
      
      // Grant permissions manually
      const adminPermissions = [
        'create_case',
        'edit_case',
        'delete_case',
        'view_case',
        'manage_users',
        'export_data',
        'manage_system',
        'view_analytics'
      ];
      
      const permissionsToInsert = adminPermissions.map(permission => ({
        user_id: authUser.user.id,
        permission: permission,
        granted_at: new Date().toISOString()
      }));
      
      const { error: insertPermissionsError } = await supabase
        .from('user_permissions')
        .insert(permissionsToInsert);
        
      if (insertPermissionsError) {
        console.error('Error granting permissions manually:', insertPermissionsError.message);
      } else {
        console.log('Admin permissions granted manually');
      }
    } else {
      console.log(`Permissions granted automatically: ${permissions.length} permissions`);
    }

    console.log('\n✅ Admin user created successfully!');
    console.log('====================================');
    console.log('Email:', email);
    console.log('Full Name:', fullName);
    console.log('Organization:', organization);
    console.log('Role: admin');
    console.log('====================================');
    console.log('You can now log in with these credentials at /auth/login');

  } catch (error) {
    console.error('Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the function
createAdminUser();
