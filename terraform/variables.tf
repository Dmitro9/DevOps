variable "project_name" {
  description = "Назва проєкту для іменування ресурсів"
  type        = string
  default     = "studshare"
}

variable "environment" {
  description = "Середовище розгортання (dev, staging, prod)"
  type        = string
  default     = "prod2"
}

variable "location" {
  description = "Регіон дата-центру Azure"
  type        = string
  default     = "germanywestcentral"
}

variable "vm_size" {
  description = "Розмір віртуальної машини (Standard_B2ats_v2 входить у студентський ліміт)"
  type        = string
  default = "Standard_B2als_v2"
}

variable "admin_username" {
  description = "Ім'я адміністратора Linux VM"
  type        = string
  default     = "azureuser"
}

variable "ssh_public_key_path" {
  description = "Шлях до публічного SSH-ключа для доступу до сервера"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "allowed_ssh_cidr" {
  description = "Діапазон IP-адрес, з яких дозволено SSH-підключення"
  type        = string
  default     = "0.0.0.0/0"
}