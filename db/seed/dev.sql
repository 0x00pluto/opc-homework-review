-- 本地 / 演示环境种子数据（可重复执行，幂等）
-- 勿写入生产敏感信息；生产环境请勿执行 db:seed

-- 班级
INSERT INTO opc_cohorts (name)
SELECT 'OPC 一期'
WHERE NOT EXISTS (SELECT 1 FROM opc_cohorts WHERE name = 'OPC 一期');

-- 学员（README 体验账号：stu_001 / 123456）
INSERT INTO opc_students (student_id, name, cohort_name, password)
SELECT 'stu_001', '测试学员', 'OPC 一期', '123456'
WHERE NOT EXISTS (
  SELECT 1 FROM opc_students WHERE student_id = 'stu_001'
);

INSERT INTO opc_students (student_id, name, cohort_name, password)
SELECT 'stu_002', '示例学员乙', 'OPC 一期', '123456'
WHERE NOT EXISTS (
  SELECT 1 FROM opc_students WHERE student_id = 'stu_002'
);

-- 示例题目（与 initial_schema 一致，缺省时补齐）
INSERT INTO opc_assignments (title, description, cohort_name)
SELECT
  'Day 2: 职业转型自述',
  '讲述自己为何想成为超级个体（不少于200字）。',
  '全员'
WHERE NOT EXISTS (SELECT 1 FROM opc_assignments LIMIT 1);
