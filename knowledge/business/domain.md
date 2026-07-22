# Domínio de Negócio

Este sistema lida com telemetria de uma **planta industrial / fábrica**.

## Entidades Principais
- **Sensor**: Representa um dispositivo medindo Temperatura, Pressão, Umidade ou Vibração. 
- **Reading**: Medição em um ponto no tempo. Possui valor, unidade, timestamp e flag de anomalia.
- **Alert**: Registrado sempre que uma leitura ultrapassa thresholds de `warning` ou `critical`. Pode ser "resolvido" (acknowledged) pelo usuário.
- **Threshold**: Limites fixos de segurança de operação para o maquinário monitorado.
