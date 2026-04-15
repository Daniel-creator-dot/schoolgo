import pg from 'pg';
const pool = new pg.Pool({user:'postgres',host:'localhost',database:'school',password:'Admin',port:5432});

// Check departments and their hod_id
const depts = await pool.query("SELECT id, name, hod_id FROM departments ORDER BY name");
console.log("=== DEPARTMENTS ===");
console.log(JSON.stringify(depts.rows, null, 2));

// Check staff with role HOD or named umtiti/yeboah
const staff = await pool.query("SELECT id, name, role, department_id, reports_to FROM staff WHERE name ILIKE '%umtiti%' OR name ILIKE '%yeboah%' OR role = 'HOD' ORDER BY name");
console.log("\n=== RELEVANT STAFF ===");
console.log(JSON.stringify(staff.rows, null, 2));

await pool.end();
