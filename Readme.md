# Лабораторна робота №1: Аналіз, вимоги, життєвий цикл та архітектурне бачення
**Проєкт:** StudShare — Студентський портал для централізованого обміну навчальними матеріалами, конспектами та прикладами лабораторних робіт.

---

## 1. Формування вимог

### 1.1. Опис бізнес-ідеї
**Проблема:** Навчальні матеріали студентів (конспекти лекцій, методички, приклади виконання лабораторних і курсових робіт, питання до іспитів) зазвичай розпорошені по десятках приватних Telegram-чатів, локальних комп'ютерах або неструктурованих папках на Google Диску. Зі зміною курсів ці знання втрачаються, а пошук потрібного матеріалу займає багато часу.

**Рішення:** Вебпортал **StudShare**, який забезпечує централізоване, структуроване за факультетами, спеціальностями, семестрами та дисциплінами сховище навчальних матеріалів. Студенти можуть завантажувати власні напрацювання, шукати перевірені матеріали, оцінювати їхню якість, залишати коментарі та отримувати бали репутації за допомогу спільноті.

### 1.2. Функціональні вимоги (User Stories)

#### Роль: Студент (Користувач / Читач)
* **US-01 (Авторизація):** Як студент, я хочу авторизуватися через корпоративну пошту університету (SSO / OAuth2), щоб отримати доступ до матеріалів свого факультету.
* **US-02 (Пошук та фільтрація):** Як студент, я хочу шукати матеріали за назвою дисципліни, викладачем, курсом, типом роботи (лекція, лабораторна, шпаргалка) або тегами, щоб швидко знайти релевантний приклад.
* **US-03 (Перегляд та завантаження):** Як студент, я хочу переглядати PDF/Markdown-конспекти безпосередньо у браузері та завантажувати архіви з прикладами коду лабораторних робіт.
* **US-04 (Оцінювання та відгуки):** Як студент, я хочу ставити оцінки (upvote/downvote) та залишати коментарі під матеріалами, щоб піднімати в рейтингу найякісніші конспекти.

#### Роль: Студент (Автор контенту)
* **US-05 (Публікація матеріалу):** Як автор, я хочу завантажити файл (PDF, DOCX, ZIP) з описом, прив'язкою до предмета та року навчання, щоб поділитися своїм конспектом чи лабораторною з молодшими курсами.
* **US-06 (Версіонування):** Як автор, я хочу оновлювати завантажений файл після виправлення зауважень викладача, щоб інші студенти бачили актуальну версію роботи.

#### Роль: Староста / Модератор
* **US-07 (Модерація контенту):** Як модератор, я хочу перевіряти скарги на матеріали, видаляти дублікати, спам або пошкоджені файли, щоб підтримувати чистоту бази знань.
* **US-08 (Управління довідниками):** Як модератор, я хочу додавати нові навчальні дисципліни та викладачів на початку семестру, щоб структура каталогу залишалася актуальною.

---

## 2. Нефункціональні вимоги (НФВ / NFR) та їхній вплив на DevOps

Нефункціональні вимоги безпосередньо визначають архітектуру інфраструктури та інструменти DevOps-інженера:

| Категорія НФВ | Опис вимоги та цільові метрики | Вплив на архітектуру та вибір DevOps-інструментів |
| :--- | :--- | :--- |
| **1. Масштабованість (Scalability)** | Навантаження на портал має яскраво виражений сезонний характер: під час заліково-екзаменаційної сесії трафік зростає у $10\text{--}15$ разів (до $5000$ одночасних користувачів, пікова швидкість запитів — до $800\text{ RPS}$). | • **Контейнеризація та оркестрація:** Використання **Docker** та **Kubernetes (K8s)** з налаштованим *Horizontal Pod Autoscaler (HPA)* за метриками CPU/RAM.<br>• **Stateless-архітектура:** Відділення статики та завантажених студентами файлів у об'єктне сховище **S3 / MinIO**, щоб pod'и бекенду могли масштабуватися миттєво.<br>• **Кешування:** Використання **Redis** для кешування популярних пошукових запитів та каталогів предметів. |
| **2. Доступність та надійність (Availability)** | Рівень доступності сервісу має становити $SLA \ge 99.5\%$ (допустимий простій не більше $3.65$ год/місяць), особливо в нічний час перед іспитами. Втрата завантажених файлів недопустима ($RPO < 1\text{ год}$, $RTO < 30\text{ хв}$). | • **База даних:** Кластер **PostgreSQL** у конфігурації Primary-Replica з автоматичним перемиканням (Failover).<br>• **Zero-Downtime Deployment:** Використання стратегії *RollingUpdate* або *Blue/Green* у Kubernetes під час викатки нових релізів через **ArgoCD / GitHub Actions**.<br>• **Резервне копіювання:** Автоматизовані щоденні снепшоти БД та версіонування бакетів в S3. |
| **3. Безпека (Security)** | Оскільки студенти завантажують ZIP-архіви та документи, система має блокувати розповсюдження шкідливого ПЗ. Доступ до порталу — лише для верифікованих студентів за протоколом HTTPS ($TLS\ 1.3$). | • **Асинхронна перевірка файлів:** Інтеграція антивірусного контейнера **ClamAV** у фоновий воркер перед тим, як файл стане доступним для скачування.<br>• **DevSecOps у CI/CD:** Автоматичне сканування коду (**SonarQube**), залежностей (**Dependabot**) та Docker-образів (**Trivy**) на вразливості.<br>• **Секрети та мережа:** Зберігання паролів у **HashiCorp Vault / K8s Secrets**, автоматичний випуск сертифікатів через **cert-manager (Let's Encrypt)**. |
| **4. Спостережуваність (Observability)** | Час відповіді API для $95\%$ запитів не має перевищувати $p_{95} \le 250\text{ мс}$. Команда повинна бачити стан черги обробки файлів та отримувати сповіщення про помилки $5\text{xx}$ за $\le 1\text{ хв}$. | • **Метрики та алертинг:** Збір метрик інфраструктури та додатку за допомогою **Prometheus**, візуалізація у **Grafana**, сповіщення в Telegram/Slack через **Alertmanager**.<br>• **Централізоване логування:** Стек **Grafana Loki + Promtail** для збору логів з усіх контейнерів.<br>• **Трейсинг:** **OpenTelemetry** для відстеження затримок між API, БД та S3. |

---

## 3. Життєвий цикл та методологія розробки

### 3.1. Перехід від класичних моделей (Waterfall / RUP) до Agile + DevOps
У класичних методологіях, таких як каскадна модель (Waterfall) або традиційний **Rational Unified Process (RUP)**, життєвий цикл чітко поділявся на послідовні фази (*Inception, Elaboration, Construction, Transition*). 
* **Недоліки RUP для порталу StudShare:** Розробники (Dev) місяцями писали б код у фазі *Construction*, після чого передавали б артефакти системним адміністраторам (Ops) на фазі *Transition*. Це створювало «стіну непорозуміння»: код, який працював на локальному ноутбуці розробника, падав на сервері через різні версії бібліотек або обмеження файлової системи при завантаженні великих лабораторних робіт.

### 3.2. Обрана методологія: Agile (Scrum) з інтеграцією DevOps
Для розробки **StudShare** обрано ітеративну методологію **Scrum** (тривалість спринту — 2 тижні) у поєднанні з практиками **DevOps** та **Continuous Delivery (Безперервна доставка)**:

1. **Plan & Design (Architecture as Code):** На початку спринту нові вимоги та зміни архітектури фіксуються у вигляді коду (Mermaid/Structurizr DSL) та ADR безпосередньо в Git-репозиторії.
2. **Code & Shift-Left Testing:** Розробники працюють у коротких гілках (*Feature Branches* / *Trunk-Based Development*). Локальне середовище повністю ідентичне продакшену завдяки `docker-compose`.
3. **Continuous Integration (CI):** При кожному *Pull Request* автоматично запускається пайплайн (GitHub Actions / GitLab CI):
   * Лінтери та статичний аналіз коду (ESLint, SonarQube).
   * Юніт- та інтеграційні тести (з підняттям тестової PostgreSQL та MinIO у контейнерах).
   * Збірка Docker-образу та його сканування на вразливості (Trivy).
4. **Continuous Delivery / Deployment (CD):**
   * Після злиття в гілку `main` образ публікується в Container Registry.
   * Інфраструктура описується декларативно (**Infrastructure as Code — Terraform** та **Helm-чарти**).
   * GitOps-інструмент (**ArgoCD**) автоматично синхронізує стан кластера Kubernetes із репозиторієм, розгортаючи оновлення на *Staging*, а після автоматичних димових тестів (Smoke Tests) — на *Production*.
5. **Operate & Monitor:** Зворотний зв'язок із Prometheus/Grafana дозволяє команді бачити реальне споживання ресурсів під час сесії та планувати оптимізації на наступний спринт.

---

## 4. Архітектурне проєктування (Модель C4 та 4+1 Deployment View)

> **Примітка:** Діаграми нижче описані за допомогою **Mermaid.js** відповідно до підходу *Architecture as Code (AaC)*. Також у репозиторії міститься файл `architecture.dsl` для генерації діаграм через **Structurizr**.

### 4.1. C4 Рівень 1: Контекстна діаграма системи (System Context)
Показує систему **StudShare** у центрі та її взаємодію з користувачами й зовнішніми сервісами.

~~~mermaid
flowchart TB
    %% Актори
    Student(["<b>Студент</b><br/>[Person]<br/>Шукає конспекти, завантажує власні лабораторні роботи, оцінює матеріали"])
    Moderator(["<b>Модератор / Староста</b><br/>[Person]<br/>Керує списком предметів, модерує контент і скарги"])

    %% Основна система
    StudShare["<b>Портал StudShare</b><br/>[Software System]<br/>Централізована платформа для обміну навчальними матеріалами та лабораторними роботами"]

    %% Зовнішні системи
    UniSSO["<b>Університетський SSO (OAuth2)</b><br/>[External System]<br/>Перевірка належності користувача до університету"]
    NotifySys["<b>Сервіс сповіщень (Telegram API / SMTP)</b><br/>[External System]<br/>Надсилання сповіщень про нові матеріали та статус модерації"]

    %% Зв'язки
    Student -->|"Шукає, переглядає та завантажує матеріали (HTTPS)"| StudShare
    Moderator -->|"Модерує файли та оновлює каталог дисциплін (HTTPS)"| StudShare
    StudShare -->|"Автентифікує студентів (OIDC / OAuth 2.0)"| UniSSO
    StudShare -->|"Надсилає сповіщення користувачам (HTTPS / SMTP)"| NotifySys

    classDef person fill:#08427b,stroke:#052e56,color:#ffffff
    classDef system fill:#1168bd,stroke:#0b4884,color:#ffffff
    classDef external fill:#999999,stroke:#6b6b6b,color:#ffffff

    class Student,Moderator person
    class StudShare system
    class UniSSO,NotifySys external
~~~

---

### 4.2. C4 Рівень 2: Діаграма контейнерів (Container Diagram)
Розкриває внутрішню будову системи **StudShare** на рівні окремо розгортуваних одиниць (контейнерів).

~~~mermaid
flowchart TB
    Student(["<b>Студент / Модератор</b><br/>[Person]"])

    subgraph StudShare_Boundary ["Межі системи StudShare"]
        SPA["<b>Single-Page Application</b><br/>[Container: React / TypeScript]<br/>Надає інтерфейс пошуку, перегляду PDF та завантаження файлів у браузері"]
        API["<b>Core Backend API</b><br/>[Container: Node.js / NestJS]<br/>Обробляє бізнес-логіку, авторизацію, пошук, рейтинги та метадані"]
        Worker["<b>File Processing Worker</b><br/>[Container: Node.js / BullMQ Worker]<br/>Асинхронно перевіряє файли на віруси та генерує PDF-прев'ю"]
        ClamAV["<b>ClamAV Antivirus Engine</b><br/>[Container: ClamAV Daemon]<br/>Сканує завантажені архіви лабораторних робіт на шкідливий код"]
        
        DB[("<b>Relational Database</b><br/>[Container: PostgreSQL 16]<br/>Зберігає користувачів, дисципліни, метадані файлів, коментарі та рейтинги")]
        Cache[("<b>In-Memory Cache & Queue</b><br/>[Container: Redis 7]<br/>Кешує каталоги предметів та зберігає чергу задач на перевірку файлів")]
        S3[("<b>Object Storage</b><br/>[Container: MinIO / AWS S3]<br/>Зберігає бінарні файли конспектів (PDF, DOCX) та архіви лабораторних (ZIP)")]
    end

    UniSSO["<b>Університетський SSO</b><br/>[External System]"]
    NotifySys["<b>Telegram API / SMTP</b><br/>[External System]"]

    %% Взаємодія
    Student -->|"Відкриває портал та завантажує файли (HTTPS)"| SPA
    SPA -->|"Викликає REST API (JSON/HTTPS)"| API
    SPA -->|"Завантажує файли напряму за Pre-signed URLs (HTTPS)"| S3

    API -->|"Читає та записує метадані (TCP/SQL)"| DB
    API -->|"Кешує запити та ставить задачі в чергу (TCP)"| Cache
    API -->|"Генерує Pre-signed URLs для доступу до файлів (S3 API)"| S3
    API -->|"Перевіряє токени авторизації (HTTPS)"| UniSSO

    Worker -->|"Бере задачі на обробку нових файлів (TCP)"| Cache
    Worker -->|"Завантажує файл для перевірки та зберігає прев'ю (S3 API)"| S3
    Worker -->|"Відправляє файл на антивірусне сканування (TCP)"| ClamAV
    Worker -->|"Оновлює статус перевірки файлу (TCP/SQL)"| DB
    Worker -->|"Надсилає сповіщення про успішну публікацію (HTTPS)"| NotifySys

    classDef person fill:#08427b,stroke:#052e56,color:#ffffff
    classDef container fill:#438dd5,stroke:#2e6295,color:#ffffff
    classDef db fill:#2b6cb0,stroke:#1a365d,color:#ffffff
    classDef external fill:#999999,stroke:#6b6b6b,color:#ffffff

    class Student person
    class SPA,API,Worker,ClamAV container
    class DB,Cache,S3 db
    class UniSSO,NotifySys external
~~~

---

### 4.3. Модель 4+1: Фізичний вигляд / Вигляд розгортання (Deployment View)
Показує, як програмні контейнери мапляться на хмарну інфраструктуру та кластер Kubernetes з урахуванням вимог масштабованості, безпеки та observability.

~~~mermaid
flowchart TB
    subgraph Client_Node ["Клієнтське середовище"]
        Browser["Веббраузер студента"]
    end

    subgraph Cloud_Infra ["Хмарна інфраструктура (AWS / DigitalOcean Cloud)"]
        LB["<b>Cloud Load Balancer / Ingress NGINX</b><br/>[TLS Termination, Rate Limiting]"]

        subgraph K8s_Cluster ["Kubernetes Cluster (Production)"]
            subgraph App_Namespace ["Namespace: studshare-prod"]
                Frontend_Pods["<b>Deployment: Frontend SPA</b><br/>[Nginx + React Static]<br/>Replicas: 2"]
                API_Pods["<b>Deployment: Core Backend API</b><br/>[NestJS Container]<br/>HPA Replicas: 2..10"]
                Worker_Pods["<b>Deployment: File Worker + ClamAV</b><br/>[Worker + Sidecar ClamAV]<br/>HPA Replicas: 1..5"]
                Redis_Pod["<b>StatefulSet: Redis</b><br/>[Cache & Job Queue]"]
            end

            subgraph Monitoring_Namespace ["Namespace: observability"]
                Prom_Grafana["<b>Prometheus + Grafana + Loki</b><br/>[Збір метрик, логів та алертинг]"]
            end
        end

        subgraph Managed_Services ["Хмарні керовані сервіси (Managed Storage)"]
            PG_Cluster[("<b>Managed PostgreSQL</b><br/>[Primary + Standby Replica]<br/>Multi-AZ")]
            S3_Bucket[("<b>S3 Object Storage + CDN</b><br/>[Бакет навчальних матеріалів]")]
        end
    end

    Browser -->|"HTTPS (443)"| LB
    Browser -->|"HTTPS (Pre-signed URL)"| S3_Bucket
    LB -->|"HTTP (80)"| Frontend_Pods
    LB -->|"HTTP (3000) /api/*"| API_Pods

    API_Pods -->|"TCP (5432)"| PG_Cluster
    API_Pods -->|"TCP (6379)"| Redis_Pod
    API_Pods -->|"HTTPS (S3 API)"| S3_Bucket

    Worker_Pods -->|"TCP (6379)"| Redis_Pod
    Worker_Pods -->|"HTTPS (S3 API)"| S3_Bucket
    Worker_Pods -->|"TCP (5432)"| PG_Cluster

    Prom_Grafana -.->|"Scrape /metrics & logs"| API_Pods
    Prom_Grafana -.->|"Scrape /metrics & logs"| Worker_Pods

    classDef infra fill:#e2e8f0,stroke:#475569,color:#0f172a
    classDef k8s fill:#326ce5,stroke:#1e40af,color:#ffffff
    classDef storage fill:#0f766e,stroke:#115e59,color:#ffffff
    classDef obs fill:#7c3aed,stroke:#5b21b6,color:#ffffff

    class Frontend_Pods,API_Pods,Worker_Pods,Redis_Pod k8s
    class PG_Cluster,S3_Bucket storage
    class Prom_Grafana obs
~~~

---

## 5. Журнал архітектурних рішень (Architecture Decision Records)

Усі архітектурні рішення зберігаються у каталозі `docs/adr/`:
1. [ADR-0001: Гібридна архітектура зберігання даних (PostgreSQL + S3 Object Storage)](docs/adr/adr_0001.md)
2. [ADR-0002: Вибір технологічного стеку та асинхронної обробки файлів у Kubernetes](docs/adr/adr_0002.md)

---

# Лабораторна робота №2: Контейнеризація та локальне середовище

**Мета:** перенести архітектуру контейнерів (C4 Container View) порталу **StudShare** у відтворюване локальне середовище за допомогою Docker та Docker Compose із дотриманням принципів 12-Factor App і базових практик безпеки.

## Склад контейнерів та мережева ізоляція

| Сервіс | Контейнер | Технологія / Базовий образ | Користувач | Мережі | Доступність портів |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `studshare-frontend` | React (Vite) + `nginx-unprivileged:1.27-alpine` | `nginx` (UID 101) | `frontend-net` | `8080:8080` (публічний) |
| **Backend API** | `studshare-backend` | Node.js 20 (TypeScript, Express) на `node:20-alpine` | `node` | `frontend-net`, `backend-net` | `3000` (лише всередині) |
| **Database** | `studshare-db` | `postgres:16-alpine` | `postgres` | `backend-net` (`internal: true`) | `5432` (лише для Backend) |

## Реалізовані вимоги та практики

* **Методологія 12-Factor App:**
  * *Фактор III (Конфігурація):* усі паролі, хости та порти винесені у змінні оточення через `.env` (у репозиторії зберігається лише шаблон `.env.example`, а `.env` виключено через `.gitignore`).
  * *Фактор VI (Процеси):* сервіси Frontend та Backend є безстановими (*stateless*), а дані БД зберігаються в іменованому томі `pg_data`.
  * *Фактор IX (Утилізованість):* у `backend/src/index.ts` реалізовано коректне завершення роботи (*graceful shutdown*) при отриманні сигналів `SIGTERM` / `SIGINT`.
* **Оптимізація та безпека образів:** для обох власних сервісів застосовано багатоетапні збірки (*Multi-stage builds*), налаштовано `.dockerignore` та запуск процесів від непривілейованих користувачів (*non-root*).
* **Оркестрація та контроль готовності:** у `docker-compose.yml` налаштовано перевірки стану (*Healthchecks*) для всіх трьох сервісів і порядок запуску через `depends_on` з умовою `condition: service_healthy`.
* **Ізоляція бази даних:** мережа `backend-net` налаштована з параметром `internal: true` — база даних недоступна напряму ззовні та з контейнера Frontend.
* **Архітектурна документація:** обґрунтування вибору базових образів Alpine і стратегії сегментації мереж зафіксовано у [ADR 0003](docs/adr/adr_0003.md).

---

## Лабораторна робота №3: Безперервна інтеграція (CI) та контроль якості коду

**Мета:** автоматизувати перевірку якості й безпеки коду (Quality Gates), налаштувати CI-конвеєр у GitHub Actions та організувати публікацію незмінних Docker-образів порталу **StudShare** у реєстр контейнерів GHCR.

## Стратегія розгалуження та захист `main`

* **Модель:** **GitHub Flow** — основна гілка `main` завжди залишається стабільною, а всі зміни виконуються у короткоживучих гілках (`feat/*`, `fix/*`, `docs/*`) і вливаються через Pull Request.
* **Branch Protection Rules для `main`:**
  * Заборона прямого пушу (`Direct Push`) — зміни потрапляють лише через Pull Request.
  * Обов'язкова наявність мінімум 1 схвалення (*Approve*).
  * Обов'язкове успішне проходження всіх 5 перевірок CI (*Status Checks*): `Lint Code & Dockerfiles`, `Run Tests & Verify Builds`, `Security Scan (Dependencies & Configs)`, `Build, Scan & Push (backend)`, `Build, Scan & Push (frontend)`.

## Структура CI-пайплайну (`.github/workflows/ci.yml`)

| Етап (Stage) | Джоба (Job) | Інструменти та перевірки | Принцип Fail Fast |
| :--- | :--- | :--- | :--- |
| **1. Linting** | `Lint Code & Dockerfiles` | **ESLint** (Backend TS + Frontend React), **Hadolint** (обидва `Dockerfile`), кешування `npm` | Помилка стилю або `warning` у Dockerfile зупиняє конвеєр |
| **2. Testing** | `Run Tests & Verify Builds` | Модульні тести Backend (`node --test`), перевірка збірки Frontend (`vite build`), кешування `npm` | Падіння будь-якого тесту блокує збірку образів |
| **3. DevSecOps (SCA)** | `Security Scan (Dependencies & Configs)` | **Trivy** (`fs`-сканування репозиторію та залежностей на CVE) | Наявність виправлених `CRITICAL` CVE завершує етап з помилкою |
| **4. Build & Package** | `Build, Scan & Push (backend / frontend)` | **Docker Buildx**, **Trivy** (сканування зібраного образу), тегування `sha-<GIT_SHA>` / `SemVer`, публікація в **GHCR** | Публікація виконується лише після успішного сканування образу та злиття в `main` |

## Артефакти та документація

* **Реєстр контейнерів (GHCR):**
  * `ghcr.io/dmitro9/studshare-backend:sha-<7-символів-коміту>`
  * `ghcr.io/dmitro9/studshare-frontend:sha-<7-символів-коміту>`
* **Локальний запуск тестів і лінтерів:**
  ```bash
  cd backend && npm install && npm run lint && npm test
  cd ../frontend && npm install && npm run lint && npm run build

* **Архітектурне рішення:** вибір GitHub Actions + GHCR, політика Quality Gates і стратегія версіонування зафіксовані у ADR 0004.

## Лабораторна робота №4: Інфраструктура та автоматизація (IaC: Terraform + Ansible)

Для відтворюваного розгортання середовища застосунку **StudShare** у хмарі **Microsoft Azure** (регіон `denmarkeast`, VM `Standard_B2als_v2`, Ubuntu 22.04 LTS) реалізовано підхід Infrastructure as Code та Configuration Management:

- **`terraform/`** — декларативний опис хмарної інфраструктури (`providers.tf`, `variables.tf`, `main.tf`, `outputs.tf`): створення Resource Group, VNet, Subnet, NSG (відкриті порти `22`, `80`, `443`), Public IP, NIC та віртуальної машини з RSA SSH-автентифікацією.
- **`ansible/`** — ідемпотентна конфігурація сервера (`ansible.cfg`, `inventory.ini`, `playbook.yml`): оновлення пакетів ОС, налаштування фаєрволу `ufw`, встановлення Docker Engine і Docker Compose plugin, додавання користувача до групи `docker` та створення каталогів `/opt/studshare/{app,data,nginx}`.
- **`docs/adr/adr_0005.md`** — архітектурне рішення (ADR) щодо вибору провайдера, розподілу відповідальності між Terraform та Ansible і політики зберігання стану `terraform.tfstate`.

### Швидкий запуск

```bash
# 1. Розгортання інфраструктури в Azure
cd terraform
terraform init
terraform apply

# 2. Конфігурація сервера через Ansible
cd ../ansible
ansible-playbook playbook.yml
```
## Лабораторна робота №5 Безперервне розгортання (CD) та Обсервабіліті (Моніторинг і Логування)

1. **Налаштовано безперервне розгортання (CD) у GitHub Actions (`.github/workflows/ci.yml`):**
   - Додано фінальний етап **`Deploy to Azure VM & Smoke Test`**, який автоматично запускається після злиття Pull Request у захищену гілку `main`.
   - Реалізовано безпечну передачу `docker-compose.prod.yml` та конфігурацій моніторингу (`monitoring/`) на хмарний сервер через `scp` із використанням GitHub Actions Secrets (`SERVER_HOST`, `SSH_PRIVATE_KEY`, `POSTGRES_*`, `GRAFANA_PASSWORD`).
   - Налаштовано генерацію `.env` із незмінним тегом образу `sha-<short_sha>` із **GitHub Container Registry (GHCR)** та автоматичне оновлення контейнерів (`docker compose -f docker-compose.prod.yml pull && up -d --remove-orphans`).
   - Реалізовано автоматичний **Post-Deploy Smoke Test**, який перевіряє доступність розгорнутого застосунку за ендпоінтом `/healthz` (очікуваний статус `HTTP 200 OK`).

2. **Інструментовано бекенд та розгорнуто стек спостережуваності (Observability):**
   - У `backend/src/index.ts` додано ендпоінт **`/metrics`** у форматі Prometheus для експорту лічильників HTTP-запитів (`http_requests_total`), статусів відповідей та гістограми затримок (`http_request_duration_seconds`).
   - У `docker-compose.prod.yml` піднято ізольовану мережу `monitoring-net` зі стеком моніторингу:
     - **Prometheus (`v2.55.1`)** — збір метрик із `studshare-backend:3000`, `node-exporter:9100`, `cadvisor:8080` та `localhost:9090`.
     - **Node Exporter (`v1.8.2`)** — моніторинг ресурсів хостової ОС (CPU, RAM, Disk I/O, Network).
     - **cAdvisor (`v0.49.1`)** — моніторинг споживання CPU та пам'яті Docker-контейнерами.
     - **Grafana (`11.3.0`)** — візуалізація метрик із автоматичним провіжинінгом джерела даних Prometheus.
   - Для всіх 7 контейнерів налаштовано ротацію журналів Docker (`driver: json-file`, `max-size: 10m`, `max-file: 3`).

3. **Створено дашборди в Grafana:**
   - Імпортовано інфраструктурний дашборд **Node Exporter Full** (ID `1860`) для контролю навантаження віртуальної машини Azure.
   - Створено власний дашборд **StudShare Containers & RED**, який відображає утилізацію CPU і RAM контейнерів (`cAdvisor`) та показники роботи сервісу за методологією **RED**:
     - **Rate:** інтенсивність запитів (`sum(rate(http_requests_total[1m]))`).
     - **Errors:** частота помилок HTTP 5xx (`sum(rate(http_requests_total{status=~"5.."}[1m])) or vector(0)`).
     - **Duration:** 95-й перцентиль затримки відповідей (`histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`).

4. **Налаштовано Alerting у Telegram та проведено симуляцію збою:**
   - Підключено канал сповіщень **Telegram Alerts** через Telegram Bot API.
   - Створено правило тривоги **`StudShare Backend Down`** (`up{job="studshare-backend"} < 1`, інтервал перевірки `10s`, Pending period `30s`).
   - Проведено тестування відмовостійкості: виконано зупинку контейнера (`docker stop studshare-backend`), зафіксовано перехід правила у стан **`Firing`** у Grafana та отримано сповіщення про інцидент у Telegram, після чого роботу сервісу відновлено (`docker start studshare-backend`).

5. **Задокументовано рішення та очищено хмарні ресурси:**
   - Оформлено запис архітектурного рішення [ADR-0006](docs/adr/adr_0006.md).
   - Після завершення перевірок усі хмарні ресурси в Microsoft Azure видалено командою `terraform destroy`.