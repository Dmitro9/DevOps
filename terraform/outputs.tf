output "resource_group_name" {
  description = "Назва створеної групи ресурсів Azure"
  value       = azurerm_resource_group.main.name
}

output "vm_name" {
  description = "Ім'я віртуальної машини"
  value       = azurerm_linux_virtual_machine.main.name
}

output "public_ip_address" {
  description = "Публічна IP-адреса створеного сервера"
  value       = azurerm_public_ip.main.ip_address
}

output "ssh_command" {
  description = "Команда для підключення до сервера по SSH"
  value       = "ssh ${var.admin_username}@${azurerm_public_ip.main.ip_address}"
}