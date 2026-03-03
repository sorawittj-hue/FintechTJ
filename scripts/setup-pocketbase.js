#!/usr/bin/env node
/**
 * PocketBase Setup Script
 * Creates collections and configures API rules automatically
 * 
 * Usage: node scripts/setup-pocketbase.js
 */

const POCKETBASE_URL = 'http://127.0.0.1:8090';
const ADMIN_EMAIL = 'porchtj@gmail.com';
const ADMIN_PASSWORD = '909090';

// Collection definitions
const COLLECTIONS = [
  {
    name: 'portfolio_positions',
    type: 'base',
    fields: [
      { name: 'user', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: true } },
      { name: 'symbol', type: 'text', required: true, unique: false },
      { name: 'name', type: 'text', required: true },
      { name: 'type', type: 'select', required: true, options: { values: ['crypto', 'stock', 'commodity', 'forex', 'etf'] } },
      { name: 'quantity', type: 'number', required: true },
      { name: 'avgPrice', type: 'number', required: true },
      { name: 'currentPrice', type: 'number' },
      { name: 'value', type: 'number' },
      { name: 'change24h', type: 'number' },
      { name: 'change24hValue', type: 'number' },
      { name: 'allocation', type: 'number' },
      { name: 'notes', type: 'text' },
      { name: 'color', type: 'text' },
      { name: 'icon', type: 'text' },
      { name: 'isActive', type: 'bool', required: true }
    ],
    indexes: ['user', 'symbol', 'type'],
    listRule: 'user.id = @request.auth.id',
    viewRule: 'user.id = @request.auth.id',
    createRule: '@request.auth.id != "" && user = @request.auth.id',
    updateRule: 'user.id = @request.auth.id',
    deleteRule: 'user.id = @request.auth.id'
  },
  {
    name: 'transactions',
    type: 'base',
    fields: [
      { name: 'user', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: true } },
      { name: 'position', type: 'relation', required: false, options: { collectionId: 'portfolio_positions', cascadeDelete: false } },
      { name: 'type', type: 'select', required: true, options: { values: ['buy', 'sell', 'deposit', 'withdraw', 'transfer'] } },
      { name: 'symbol', type: 'text', required: true },
      { name: 'quantity', type: 'number', required: true },
      { name: 'price', type: 'number', required: true },
      { name: 'totalValue', type: 'number', required: true },
      { name: 'fee', type: 'number' },
      { name: 'timestamp', type: 'date', required: true },
      { name: 'notes', type: 'text' },
      { name: 'exchange', type: 'text' },
      { name: 'txHash', type: 'text' }
    ],
    indexes: ['user', 'timestamp', 'type', 'symbol'],
    listRule: 'user.id = @request.auth.id',
    viewRule: 'user.id = @request.auth.id',
    createRule: '@request.auth.id != "" && user = @request.auth.id',
    updateRule: 'user.id = @request.auth.id',
    deleteRule: 'user.id = @request.auth.id'
  },
  {
    name: 'alerts',
    type: 'base',
    fields: [
      { name: 'user', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: true } },
      { name: 'symbol', type: 'text', required: true },
      { name: 'type', type: 'select', required: true, options: { values: ['price', 'volume', 'percent_change', 'news'] } },
      { name: 'condition', type: 'select', required: true, options: { values: ['above', 'below', 'crosses_above', 'crosses_below'] } },
      { name: 'targetPrice', type: 'number', required: true },
      { name: 'targetValue', type: 'number' },
      { name: 'percentChange', type: 'number' },
      { name: 'isActive', type: 'bool', required: true },
      { name: 'triggeredAt', type: 'date' },
      { name: 'message', type: 'text' },
      { name: 'notifyEmail', type: 'bool', required: true },
      { name: 'notifyPush', type: 'bool', required: true },
      { name: 'soundEnabled', type: 'bool', required: true }
    ],
    indexes: ['user', 'isActive', 'symbol'],
    listRule: 'user.id = @request.auth.id',
    viewRule: 'user.id = @request.auth.id',
    createRule: '@request.auth.id != "" && user = @request.auth.id',
    updateRule: 'user.id = @request.auth.id',
    deleteRule: 'user.id = @request.auth.id'
  },
  {
    name: 'watchlist',
    type: 'base',
    fields: [
      { name: 'user', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: true } },
      { name: 'symbols', type: 'json', required: true },
      { name: 'name', type: 'text' },
      { name: 'color', type: 'text' }
    ],
    indexes: ['user'],
    listRule: 'user.id = @request.auth.id',
    viewRule: 'user.id = @request.auth.id',
    createRule: '@request.auth.id != "" && user = @request.auth.id',
    updateRule: 'user.id = @request.auth.id',
    deleteRule: 'user.id = @request.auth.id'
  },
  {
    name: 'performance_history',
    type: 'base',
    fields: [
      { name: 'user', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: true } },
      { name: 'date', type: 'date', required: true },
      { name: 'totalValue', type: 'number', required: true },
      { name: 'totalCost', type: 'number', required: true },
      { name: 'profitLoss', type: 'number', required: true },
      { name: 'profitLossPercent', type: 'number', required: true },
      { name: 'dailyChange', type: 'number' },
      { name: 'dailyChangePercent', type: 'number' },
      { name: 'topPerformer', type: 'text' },
      { name: 'worstPerformer', type: 'text' }
    ],
    indexes: ['user', 'date'],
    listRule: 'user.id = @request.auth.id',
    viewRule: 'user.id = @request.auth.id',
    createRule: '@request.auth.id != "" && user = @request.auth.id',
    updateRule: 'user.id = @request.auth.id',
    deleteRule: 'user.id = @request.auth.id'
  },
  {
    name: 'investment_goals',
    type: 'base',
    fields: [
      { name: 'user', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: true } },
      { name: 'name', type: 'text', required: true },
      { name: 'targetType', type: 'select', required: true, options: { values: ['value', 'percent', 'income'] } },
      { name: 'targetValue', type: 'number', required: true },
      { name: 'currentValue', type: 'number' },
      { name: 'deadline', type: 'date' },
      { name: 'priority', type: 'select', options: { values: ['low', 'medium', 'high'] } },
      { name: 'description', type: 'text' },
      { name: 'isAchieved', type: 'bool', required: true }
    ],
    indexes: ['user', 'isAchieved'],
    listRule: 'user.id = @request.auth.id',
    viewRule: 'user.id = @request.auth.id',
    createRule: '@request.auth.id != "" && user = @request.auth.id',
    updateRule: 'user.id = @request.auth.id',
    deleteRule: 'user.id = @request.auth.id'
  },
  {
    name: 'user_preferences',
    type: 'base',
    fields: [
      { name: 'user', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: true } },
      { name: 'theme', type: 'select', required: true, options: { values: ['light', 'dark', 'system'] } },
      { name: 'currency', type: 'select', required: true, options: { values: ['USD', 'THB', 'EUR', 'GBP', 'JPY'] } },
      { name: 'language', type: 'select', required: true, options: { values: ['en', 'th', 'zh', 'ja'] } },
      { name: 'refreshInterval', type: 'number', required: true },
      { name: 'compactMode', type: 'bool', required: true },
      { name: 'showAnimations', type: 'bool', required: true },
      { name: 'soundEnabled', type: 'bool', required: true },
      { name: 'emailNotifications', type: 'bool', required: true },
      { name: 'pushNotifications', type: 'bool', required: true }
    ],
    indexes: ['user'],
    listRule: 'user.id = @request.auth.id',
    viewRule: 'user.id = @request.auth.id',
    createRule: '@request.auth.id != "" && user = @request.auth.id',
    updateRule: 'user.id = @request.auth.id',
    deleteRule: 'user.id = @request.auth.id'
  }
];

async function setupPocketBase() {
  console.log('🚀 Starting PocketBase Setup...\n');

  try {
    // Check if PocketBase is running
    console.log('📡 Checking PocketBase connection...');
    const healthResponse = await fetch(`${POCKETBASE_URL}/api/health`);
    if (!healthResponse.ok) {
      throw new Error('PocketBase is not running. Please start it with: pocketbase/pocketbase.exe serve');
    }
    console.log('✅ PocketBase is running!\n');

    // Login as admin
    console.log('🔐 Logging in as admin...');
    const loginResponse = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    let token = '';
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      token = loginData.token;
      console.log('✅ Logged in successfully!\n');
    } else {
      console.log('⚠️  Could not login with default credentials. You may need to set up collections manually.');
      console.log('📖 Open http://127.0.0.1:8090/_/ to create collections manually.\n');
      return;
    }

    // Create collections
    console.log('📁 Creating collections...\n');
    
    for (const collection of COLLECTIONS) {
      console.log(`Creating: ${collection.name}...`);
      
      const response = await fetch(`${POCKETBASE_URL}/api/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: collection.name,
          type: collection.type,
          listRule: collection.listRule,
          viewRule: collection.viewRule,
          createRule: collection.createRule,
          updateRule: collection.updateRule,
          deleteRule: collection.deleteRule,
          schema: collection.fields.map(f => ({
            name: f.name,
            type: f.type,
            required: f.required || false,
            unique: f.unique || false,
            options: f.options || {}
          })),
          indexes: collection.indexes || []
        })
      });

      if (response.ok) {
        console.log(`✅ ${collection.name} created!\n`);
      } else {
        const error = await response.json();
        console.log(`❌ ${collection.name} failed:`, error.message || error);
      }
    }

    console.log('\n✨ PocketBase setup complete!');
    console.log('📊 Admin panel: http://127.0.0.1:8090/_/');
    console.log('📖 API docs: http://127.0.0.1:8090/_/');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n💡 Alternative: Set up collections manually at http://127.0.0.1:8090/_/');
  }
}

// Run setup
setupPocketBase();
