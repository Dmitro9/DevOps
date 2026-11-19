workspace "StudShare Portal" "Архітектура студентського порталу для централізованого обміну навчальними матеріалами, конспектами та лабораторними роботами" {

    model {
        student = person "Студент" "Шукає навчальні матеріали, завантажує конспекти та приклади лабораторних робіт, оцінює контент"
        moderator = person "Модератор / Староста" "Керує довідником дисциплін, модерує завантажені файли та розглядає скарги"

        uniSso = softwareSystem "Університетський SSO (OAuth2)" "Зовнішня система єдиного входу університету для верифікації студентів" "External"
        notifyService = softwareSystem "Сервіс сповіщень (Telegram / Email)" "Зовнішній шлюз для розсилки сповіщень користувачам" "External"

        studShare = softwareSystem "Портал StudShare" "Централізована платформа для обміну конспектами та лабораторними роботами між студентами" {
            spa = container "Single-Page Application" "Забезпечує веб-інтерфейс для пошуку, перегляду та завантаження матеріалів" "React, TypeScript" "WebBrowser"
            api = container "Core Backend API" "Надає REST API для пошуку, авторизації, управління каталогом предметів та рейтингами" "Node.js, NestJS"
            worker = container "File Processing Worker" "Фоновий сервіс для антивірусної перевірки завантажених файлів та генерації прев'ю" "Node.js, BullMQ"
            clamav = container "ClamAV Antivirus" "Перевіряє завантажені студентами архіви та документи на віруси" "ClamAV Daemon"
            db = container "Relational Database" "Зберігає профілі користувачів, структуру предметів, метадані файлів, оцінки та коментарі" "PostgreSQL 16" "Database"
            redis = container "Cache & Message Queue" "Кешує популярні запити та керує чергою задач на обробку файлів" "Redis 7" "Database"
            s3 = container "Object Storage" "Надійно зберігає файли конспектів (PDF, DOCX) та архіви лабораторних робіт (ZIP)" "MinIO / AWS S3" "Database"
        }

        # Зв'язки на рівні Context та Container
        student -> spa "Шукає, переглядає та завантажує матеріали через браузер" "HTTPS"
        moderator -> spa "Модерує матеріали та редагує список предметів" "HTTPS"

        spa -> api "Виконує запити до API" "JSON/HTTPS"
        spa -> s3 "Пряме завантаження та скачування файлів за Pre-signed URL" "HTTPS"

        api -> db "Читає та записує метадані" "SQL/TCP"
        api -> redis "Кешує дані та публікує задачі в чергу" "TCP"
        api -> s3 "Генерує Pre-signed URL для безпечного завантаження" "S3 API/HTTPS"
        api -> uniSso "Автентифікує користувачів" "OAuth 2.0 / OIDC"

        worker -> redis "Отримує задачі з черги" "TCP"
        worker -> s3 "Завантажує нові файли на перевірку та зберігає прев'ю" "S3 API/HTTPS"
        worker -> clamav "Сканує файли на наявність шкідливого коду" "TCP"
        worker -> db "Оновлює статус модерації файлу" "SQL/TCP"
        worker -> notifyService "Надсилає сповіщення автору про публікацію матеріалу" "HTTPS"

        # Модель розгортання (Deployment View 4+1)
        deploymentEnvironment "Production" {
            deploymentNode "Пристрій користувача" "" "Windows / macOS / Android / iOS" {
                deploymentNode "Веббраузер" "" "Chrome / Safari / Firefox" {
                    spaInstance = containerInstance spa
                }
            }

            deploymentNode "Cloud Provider (AWS / DigitalOcean)" "" "Cloud Infrastructure" {
                deploymentNode "Kubernetes Cluster" "" "Managed K8s (EKS / DOKS)" {
                    deploymentNode "Application Pods (HPA Enabled)" "" "Kubernetes Namespace: studshare-prod" {
                        apiInstance = containerInstance api
                        workerInstance = containerInstance worker
                        clamavInstance = containerInstance clamav
                        redisInstance = containerInstance redis
                    }
                }

                deploymentNode "Managed Database Service" "" "PostgreSQL Primary + Replica (Multi-AZ)" {
                    dbInstance = containerInstance db
                }

                deploymentNode "Cloud Object Storage" "" "S3 Compatible Storage + CDN" {
                    s3Instance = containerInstance s3
                }
            }
        }
    }

    views {
        systemContext studShare "SystemContext" "C4 Рівень 1: Контекстна діаграма студентського порталу StudShare" {
            include *
            autoLayout
        }

        container studShare "Containers" "C4 Рівень 2: Діаграма контейнерів порталу StudShare" {
            include *
            autoLayout
        }

        deployment studShare "Production" "DeploymentView" "Модель 4+1: Схема фізичного розгортання у хмарній інфраструктурі" {
            include *
            autoLayout
        }

        styles {
            element "Person" {
                shape Person
                background #08427b
                color #ffffff
            }
            element "Software System" {
                background #1168bd
                color #ffffff
            }
            element "External" {
                background #999999
                color #ffffff
            }
            element "Container" {
                background #438dd5
                color #ffffff
            }
            element "Database" {
                shape Cylinder
                background #2b6cb0
                color #ffffff
            }
            element "WebBrowser" {
                shape WebBrowser
            }
        }
    }
}