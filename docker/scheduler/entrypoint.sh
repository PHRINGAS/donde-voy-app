#!/bin/sh
# Scheduler de agentes: cron en contenedor + corrida inmediata opcional.
set -e

CRON_SCHEDULE="${CRON_SCHEDULE:-0 9 * * 1}"
RUN_ON_START="${RUN_ON_START:-true}"
AGENT_COMMAND="${AGENT_COMMAND:-all}"
LOGFILE=/tmp/agents.log

echo "[scheduler] cron: '$CRON_SCHEDULE' | comando: '$AGENT_COMMAND' | run-on-start: $RUN_ON_START"

# Esperar a que la API esté disponible antes de programar nada
echo "[scheduler] esperando a $SUPABASE_URL ..."
until wget -qO- "$SUPABASE_URL/" >/dev/null 2>&1; do
  sleep 2
done
echo "[scheduler] API disponible"

echo "$CRON_SCHEDULE cd /app && npx tsx agents/src/runner.ts $AGENT_COMMAND >> $LOGFILE 2>&1" > /etc/crontabs/root

if [ "$RUN_ON_START" = "true" ]; then
  echo "[scheduler] ejecutando corrida inicial..."
  npx tsx agents/src/runner.ts "$AGENT_COMMAND" >> $LOGFILE 2>&1 &
fi

touch $LOGFILE
tail -F $LOGFILE &
crond -f -l 8
