
/* 
 * ThirdCheck - Database Migration Script
 * Target: Neon (PostgreSQL)
 * 
 * Usage: node migrate-db.js
 * Requirement: Ensure process.env.DATABASE_URL is set.
 */

const { Client } = require('pg');

const runMigration = async () => {
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is missing.');
    process.exit(1);
  }

  console.log('Starting database migration...');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for some Neon/Cloud connections depending on CA setup
    }
  });

  try {
    await client.connect();
    console.log('Connected to Neon database.');

    // 1. Vendors Table
    console.log('Creating table: vendors');
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        status TEXT,
        lifecycle_stage TEXT,
        risk_level TEXT,
        risk_score INT,
        last_assessment_date TEXT,
        description TEXT,
        contact_email TEXT,
        logo_url TEXT,
        domains TEXT[],
        company_profile JSONB,
        contacts JSONB,
        security_profile JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Services Table
    console.log('Creating table: services');
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        vendor_id TEXT REFERENCES vendors(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        criticality TEXT,
        owner TEXT,
        sla TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Evidence Table
    console.log('Creating table: evidences');
    await client.query(`
      CREATE TABLE IF NOT EXISTS evidences (
        id TEXT PRIMARY KEY,
        vendor_id TEXT REFERENCES vendors(id) ON DELETE CASCADE,
        type TEXT,
        name TEXT,
        issue_date TEXT,
        expiry_date TEXT,
        status TEXT,
        service_id TEXT, 
        ai_validation JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Contracts Table
    console.log('Creating table: contracts');
    await client.query(`
      CREATE TABLE IF NOT EXISTS contracts (
        id TEXT PRIMARY KEY,
        vendor_id TEXT REFERENCES vendors(id) ON DELETE CASCADE,
        name TEXT,
        type TEXT,
        parent_contract_id TEXT,
        start_date TEXT,
        renewal_date TEXT,
        file_name TEXT,
        content_summary TEXT,
        clauses JSONB,
        ai_analysis JSONB,
        service_ids TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Incidents Table
    console.log('Creating table: incidents');
    await client.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        vendor_id TEXT REFERENCES vendors(id) ON DELETE CASCADE,
        date_occurred TEXT,
        date_detected TEXT,
        summary TEXT,
        description TEXT,
        severity TEXT,
        status TEXT,
        detection_method TEXT,
        impact_description TEXT,
        affected_assets TEXT,
        root_cause_analysis TEXT,
        remediation_steps TEXT,
        service_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Risk Assessments Table
    console.log('Creating table: risk_assessments');
    await client.query(`
      CREATE TABLE IF NOT EXISTS risk_assessments (
        id TEXT PRIMARY KEY,
        vendor_id TEXT REFERENCES vendors(id) ON DELETE CASCADE,
        type TEXT,
        date TEXT,
        status TEXT,
        overall_score INT,
        questionnaire_template_id TEXT,
        questionnaire_template_name TEXT,
        service_id TEXT,
        scenarios JSONB,
        answers JSONB,
        ai_analysis JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Risk Treatment Plans Table
    console.log('Creating table: risk_treatment_plans');
    await client.query(`
      CREATE TABLE IF NOT EXISTS risk_treatment_plans (
        id TEXT PRIMARY KEY,
        vendor_id TEXT REFERENCES vendors(id) ON DELETE CASCADE,
        risk_id TEXT,
        action TEXT,
        description TEXT,
        owner TEXT,
        due_date TEXT,
        status TEXT,
        suggested_correction TEXT,
        implementation_steps TEXT,
        service_id TEXT,
        incident_id TEXT,
        updates JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. People / Users Table (Access Control)
    console.log('Creating table: people');
    await client.query(`
      CREATE TABLE IF NOT EXISTS people (
        id TEXT PRIMARY KEY,
        first_name TEXT,
        last_name TEXT,
        email TEXT UNIQUE NOT NULL,
        status TEXT,
        job_title TEXT,
        department_id TEXT,
        division_id TEXT,
        profile_id TEXT,
        user_account TEXT,
        password_hash TEXT, -- Storing mock passwords in plain for demo, hash in prod
        group_ids TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 9. Config Tables (Profiles, Departments, etc.)
    console.log('Creating config tables (profiles, departments, etc.)');
    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        type TEXT,
        permissions TEXT[]
      );

      CREATE TABLE IF NOT EXISTS departments (
        id TEXT PRIMARY KEY,
        name TEXT,
        head_of_department TEXT,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS divisions (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        parent_division_id TEXT,
        region TEXT
      );

      CREATE TABLE IF NOT EXISTS user_groups (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        member_count INT
      );
    `);

    console.log('Migration completed successfully.');

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
};

runMigration();
