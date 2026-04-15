import pg from 'pg';
const pool = new pg.Pool({user:'postgres',host:'localhost',database:'school',password:'Admin',port:5432});

// Set umtiti samuel as HOD of the Science department that yeboah belongs to
const umtitiId = '00f4be7b-6729-4bf8-a705-6f4eafb46ba6';
const scienceDeptId = '495ddc23-e68a-4451-88e9-1cc73506ad27';

await pool.query("UPDATE departments SET hod_id = $1 WHERE id = $2", [umtitiId, scienceDeptId]);
console.log("Updated Science department hod_id to umtiti samuel");

// Verify
const result = await pool.query("SELECT id, name, hod_id FROM departments WHERE id = $1", [scienceDeptId]);
console.log("Verified:", JSON.stringify(result.rows[0]));

await pool.end();
