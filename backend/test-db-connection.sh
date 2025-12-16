#!/bin/bash

# Script para verificar la conexión a la base de datos AWS RDS

echo "🔍 Verificando conexión a la base de datos AWS RDS..."
echo ""

# Cargar variables del .env
if [ -f "../.env" ]; then
    export $(grep -v '^#' ../.env | xargs)
    echo "✅ Variables cargadas desde .env"
else
    echo "❌ No se encontró el archivo .env"
    exit 1
fi

echo ""
echo "📋 Configuración de la base de datos:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_DATABASE"
echo "   Username: $DB_USERNAME"
echo ""

# Verificar si psql está instalado
if ! command -v psql &> /dev/null; then
    echo "⚠️  psql no está instalado"
    echo "   Instalando con Homebrew..."
    brew install postgresql
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Probando conexión a la base de datos..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Intentar conectar
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE -c "SELECT version();" 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Conexión exitosa a la base de datos AWS RDS"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Verificando tablas existentes..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE -c "\dt" 2>&1
    
    echo ""
    echo "💡 Si no hay tablas, necesitas ejecutar las migraciones:"
    echo "   npm run migrate"
    echo ""
else
    echo ""
    echo "❌ Error al conectar a la base de datos"
    echo ""
    echo "💡 Posibles causas:"
    echo "   1. La base de datos AWS RDS no está accesible desde tu IP"
    echo "   2. Las credenciales son incorrectas"
    echo "   3. El security group de AWS no permite conexiones desde tu IP"
    echo ""
    echo "🔧 Soluciones:"
    echo "   1. Ve a AWS RDS Console"
    echo "   2. Selecciona tu base de datos: db-whatsapp"
    echo "   3. Ve a 'Security groups'"
    echo "   4. Agrega una regla de entrada para PostgreSQL (puerto 5432)"
    echo "   5. Permite tu IP pública o 0.0.0.0/0 (para testing)"
    echo ""
fi

echo ""
