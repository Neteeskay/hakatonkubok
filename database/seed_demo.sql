INSERT INTO app_user (
    id, role, email, password_hash, full_name, city, employee_id, department, position, interests, skills
) VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'admin',
        'admin@stoloto.local',
        'demo-password-hash',
        'Администратор платформы',
        'Нижний Новгород',
        NULL,
        'Корпоративное волонтерство',
        'Администратор',
        NULL,
        NULL
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'volunteer',
        'volunteer@stoloto.local',
        'demo-password-hash',
        'Иван Петров',
        'Нижний Новгород',
        'EMP-1001',
        'IT',
        'Backend developer',
        ARRAY['children', 'ecology'],
        ARRAY['python', 'analytics', 'content']
    ),
    (
        '00000000-0000-0000-0000-000000000003',
        'fund',
        'fund@example.org',
        'demo-password-hash',
        'Мария Иванова',
        'Нижний Новгород',
        NULL,
        NULL,
        'Координатор фонда',
        NULL,
        NULL
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO fund (
    id, representative_user_id, name, description, help_categories, inn, ogrn, region,
    website_url, contact_person, contact_position, contact_email, contact_phone,
    planned_help, status, approved_at
) VALUES (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    'Фонд добрых дел',
    'Помогаем детям и пожилым людям через волонтерские программы.',
    ARRAY['children', 'elderly'],
    '5250000000',
    '1025200000000',
    'Нижний Новгород',
    'https://example.org',
    'Мария Иванова',
    'Координатор фонда',
    'fund@example.org',
    '+7 900 000-00-00',
    'Разовые и регулярные волонтерские активности.',
    'approved',
    now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO volunteer_task (
    id, fund_id, title, description, category, participation_format, duration_type,
    task_type, city, location, starts_at, deadline_at, participant_limit,
    requirements, required_skills, expected_hours, status, published_at
) VALUES
    (
        '20000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        'Помощь на детском мероприятии',
        'Нужны волонтеры для регистрации участников и сопровождения гостей.',
        'children',
        'offline',
        'one_time',
        'regular',
        'Нижний Новгород',
        'ул. Большая Покровская, 1',
        now() + interval '5 days',
        now() + interval '4 days',
        8,
        'Ответственность, пунктуальность.',
        ARRAY['communication'],
        4.00,
        'published',
        now()
    ),
    (
        '20000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000001',
        'Настройка формы для отчетности фонда',
        'Нужна pro-bono помощь с простой формой сбора отчетных данных.',
        'elderly',
        'online',
        'long_term',
        'pro_bono',
        NULL,
        NULL,
        now() + interval '2 days',
        now() + interval '10 days',
        2,
        'Опыт Python или low-code форм будет плюсом.',
        ARRAY['python', 'analytics'],
        8.00,
        'published',
        now()
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO task_application (
    id, task_id, volunteer_id, status, volunteer_comment, decided_at, completion_confirmed_at
) VALUES (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'completion_confirmed',
    'Готов помочь с формой и выгрузкой.',
    now(),
    now()
)
ON CONFLICT (id) DO NOTHING;

