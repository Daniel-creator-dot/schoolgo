import fs from 'fs';

const content = fs.readFileSync('server/init-db.ts', 'utf-8');
const lines = content.split('\n');

let isInsideQuery = false;
let currentQuery = '';
const queries: string[] = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('await client.query(`')) {
    isInsideQuery = true;
    currentQuery = '';
    
    // Check if it's a one-liner
    if (line.match(/`\)/)) {
        const match = line.match(/\`([\s\S]*?)\`/);
        if (match) queries.push(match[1]);
        isInsideQuery = false;
    }
  } else if (isInsideQuery) {
    if (line.includes('`);') || line.includes('`,')) {
      isInsideQuery = false;
      queries.push(currentQuery.trim() + ';');
    } else {
      currentQuery += line + '\n';
    }
  } else if (line.includes("await client.query('")) {
    const match = line.match(/\'([\s\S]*?)\'/);
    if (match) queries.push(match[1] + ';');
  }
}

const finalSql = `-- Suppress warnings for IF NOT EXISTS
SET client_min_messages = warning;

-- Set up required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

` + queries.join('\n\n');

fs.writeFileSync('supabase_schema.sql', finalSql);
console.log('Successfully extracted ' + queries.length + ' SQL commands to supabase_schema.sql');
