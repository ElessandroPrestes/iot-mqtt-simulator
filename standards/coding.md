# Padrões de Código

## API (Node.js)
- CommonJS: Utilizar `require` e `module.exports`.
- Sem callbacks: Usar promises e `async`/`await`.
- Tratamento de Erros: Sempre direcionar erros para `next(err)` no Express, para tratamento pelo middleware `errorHandler`.

## Simulator (Node.js)
- ESM: Utilizar `import` e `export`.
- Desacoplamento: Lógica de simulação de sensor segregada por tipo em `src/sensors/`.

## Dashboard (Vue 3)
- Composition API e `<script setup>` são o padrão absoluto.
- Gerenciamento de estado complexo em stores do Pinia, lógicas reusáveis via Composables.
- Classes CSS devem utilizar utilitários do TailwindCSS preferencialmente.
