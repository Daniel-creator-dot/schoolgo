import { init } from './init-db.ts';

async function run() {
  try {
    await init();
    console.log('Successfully applied changes to Supabase!');
    process.exit(0);
  } catch (error) {
    console.error('Error applying changes:', error);
    process.exit(1);
  }
}

run();
