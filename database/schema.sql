-- database/schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT CHECK (role IN ('student', 'partner', 'advisor', 'admin')) DEFAULT 'student',
  school_or_org TEXT,
  location TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Community partners and advisors can view other profiles" ON profiles
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('partner', 'advisor', 'admin')
  );

-- community_needs table
CREATE TABLE community_needs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submitted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  beneficiaries TEXT NOT NULL,
  estimated_people_impacted INTEGER,
  location TEXT NOT NULL,
  deadline DATE,
  age_restrictions TEXT,
  safety_concerns TEXT,
  known_materials TEXT,
  budget_estimate NUMERIC,
  preferred_project_type TEXT,
  visibility TEXT CHECK (visibility IN ('private', 'local', 'public')) DEFAULT 'local',
  status TEXT CHECK (status IN ('open', 'claimed', 'in_progress', 'completed')) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE community_needs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view needs based on visibility" ON community_needs
  FOR SELECT USING (
    visibility = 'public' OR
    submitted_by = auth.uid() OR
    (visibility = 'local' AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'student')
  );

CREATE POLICY "Partners can insert needs" ON community_needs
  FOR INSERT WITH CHECK (
    submitted_by = auth.uid() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'partner'
  );

CREATE POLICY "Users can update their own needs" ON community_needs
  FOR UPDATE USING (submitted_by = auth.uid());

-- project_kits table
CREATE TABLE project_kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  need_id UUID NOT NULL REFERENCES community_needs(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  mission TEXT NOT NULL,
  problem_summary TEXT,
  beneficiaries TEXT,
  estimated_impact TEXT,
  project_type TEXT,
  difficulty_rating TEXT,
  adult_supervision_requirement TEXT,
  assumptions JSONB DEFAULT '[]'::jsonb,
  partner_questions JSONB DEFAULT '[]'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  tasks JSONB DEFAULT '[]'::jsonb,
  roles JSONB DEFAULT '[]'::jsonb,
  materials JSONB DEFAULT '[]'::jsonb,
  budget JSONB DEFAULT '{}'::jsonb,
  safety JSONB DEFAULT '[]'::jsonb,
  permissions JSONB DEFAULT '[]'::jsonb,
  outreach JSONB DEFAULT '{}'::jsonb,
  impact_metrics JSONB DEFAULT '[]'::jsonb,
  final_report_outline JSONB DEFAULT '[]'::jsonb,
  raw_ai_output JSONB,
  status TEXT CHECK (status IN ('draft', 'active', 'completed')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE project_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view kits for their needs or claimed projects" ON project_kits
  FOR SELECT USING (
    created_by = auth.uid() OR
    need_id IN (SELECT id FROM community_needs WHERE submitted_by = auth.uid())
  );

CREATE POLICY "Users can insert kits for their needs" ON project_kits
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own kits" ON project_kits
  FOR UPDATE USING (created_by = auth.uid());

-- projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kit_id UUID NOT NULL REFERENCES project_kits(id) ON DELETE CASCADE,
  student_lead_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  advisor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  community_partner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT CHECK (status IN ('planning', 'active', 'completed', 'paused')) DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view projects they are involved in" ON projects
  FOR SELECT USING (
    student_lead_id = auth.uid() OR
    advisor_id = auth.uid() OR
    community_partner_id = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Student leads can insert projects" ON projects
  FOR INSERT WITH CHECK (student_lead_id = auth.uid());

CREATE POLICY "Project members can update" ON projects
  FOR UPDATE USING (
    student_lead_id = auth.uid() OR
    advisor_id = auth.uid()
  );

-- project_tasks table
CREATE TABLE project_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date DATE,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks for their projects" ON project_tasks
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE
        student_lead_id = auth.uid() OR
        advisor_id = auth.uid() OR
        community_partner_id = auth.uid()
    )
  );

CREATE POLICY "Project members can manage tasks" ON project_tasks
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE
        student_lead_id = auth.uid() OR
        advisor_id = auth.uid()
    )
  );

CREATE POLICY "Assignees and leads can update tasks" ON project_tasks
  FOR UPDATE USING (
    assigned_to = auth.uid() OR
    project_id IN (
      SELECT id FROM projects WHERE student_lead_id = auth.uid()
    )
  );

-- impact_reports table
CREATE TABLE impact_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  volunteers_count INTEGER,
  volunteer_hours NUMERIC,
  items_collected INTEGER,
  people_served INTEGER,
  money_raised NUMERIC,
  partner_testimonial TEXT,
  student_reflection TEXT,
  outcomes TEXT,
  generated_report JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE impact_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reports for their projects" ON impact_reports
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE
        student_lead_id = auth.uid() OR
        advisor_id = auth.uid() OR
        community_partner_id = auth.uid()
    )
  );

CREATE POLICY "Project leads can create reports" ON impact_reports
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE student_lead_id = auth.uid()
    )
  );

-- Create indexes for common queries
CREATE INDEX idx_community_needs_submitted_by ON community_needs(submitted_by);
CREATE INDEX idx_community_needs_status ON community_needs(status);
CREATE INDEX idx_community_needs_category ON community_needs(category);
CREATE INDEX idx_project_kits_need_id ON project_kits(need_id);
CREATE INDEX idx_project_kits_created_by ON project_kits(created_by);
CREATE INDEX idx_projects_student_lead_id ON projects(student_lead_id);
CREATE INDEX idx_projects_kit_id ON projects(kit_id);
CREATE INDEX idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX idx_impact_reports_project_id ON impact_reports(project_id);
