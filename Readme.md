# StudShare — платформа обміну навчальними матеріалами

Вебзастосунок для обміну конспектами, лабораторними роботами та навчальними матеріалами з повним циклом автоматизації **DevOps**: контейнеризацією, інфраструктурою як кодом (IaC), конвеєром CI/CD, скануванням безпеки та стеком спостережуваності (Observability).

## Архітектура системи

- **Frontend:** React + TypeScript + Vite, обслуговується через Nginx (`8080` усередині контейнера, проброс на порт `80` хоста).
- **Backend:** Node.js + Express + TypeScript (`3000` порт), REST API `/api/materials`, перевірка стану `/health` та експорт метрик `/metrics` у форматі Prometheus.
- **Database:** PostgreSQL 16 (`alpine`) в ізольованій внутрішній мережі `backend-net` зі збереженням даних у Docker volume `pg_data`.
- **Observability Stack (`monitoring-net`):**
  - **Prometheus (`v2.55.1`)** — збір метрик із бекенду, Node Exporter, cAdvisor та самого Prometheus.
  - **Node Exporter (`v1.8.2`)** — моніторинг CPU, RAM, Disk I/O та мережі хостової ОС.
  - **cAdvisor (`v0.49.1`)** — моніторинг споживання ресурсів у розрізі Docker-контейнерів.
  - **Grafana (`11.3.0`, порт `3000`)** — візуалізація інфраструктурних та RED-метрик, система сповіщень (Alerting) із відправкою інцидентів у Telegram.

## Інфраструктура та автоматизація (IaC)

- **`terraform/`** — декларативне розгортання хмарних ресурсів у **Microsoft Azure** (Resource Group, VNet, Subnet, NSG з правилами для портів `22`, `80`, `443`, `3000`, Public IP та Linux VM Ubuntu 22.04 LTS).
- **`ansible/`** — автоматичне налаштування сервера (встановлення Docker Engine та Docker Compose, конфігурація фаєрволу UFW, створення робочої директорії `/opt/studshare/app`).

## Конвеєр CI/CD та DevSecOps (`.github/workflows/ci.yml`)

1. **Lint (`lint`):** статичний аналіз коду (ESLint) та перевірка `Dockerfile` за допомогою **Hadolint**.
2. **Test & Build (`test`):** запуск модульних тестів бекенду та верифікація збірки фронтенду.
3. **Security Scan (`security-fs`):** перевірка залежностей та конфігурацій на критичні вразливості через **Trivy**.
4. **Build, Scan & Push (`build-and-push`):** збірка Docker-образів, сканування образів через **Trivy** та публікація в **GitHub Container Registry (GHCR)** із незмінними тегами `sha-<commit>`.
5. **Continuous Deployment & Smoke Test (`deploy`):** автоматичний деплой на Azure VM по SSH при злитті змін у `main` та перевірка працездатності (`HTTP 200 OK` на `/healthz`).

## Архітектурні рішення (ADR)

- [ADR-0006: Впровадження безперервного розгортання (CD) та стеку спостережуваності](docs/adr/adr_0006.md)
