# Plano: Dark Mode

## 1. Banco de dados (1 migração)

Adicionar coluna `theme_preference` em `profiles`:
- Tipo: `text`, default `'system'`
- Constraint: `CHECK (theme_preference IN ('light','dark','system'))`
- Não mexe em RLS de outras tabelas.

## 2. Tailwind

`tailwind.config.ts` já está com `darkMode: ["class"]` ✅ (validado). Nada a alterar.

`src/index.css` já tem bloco `.dark { ... }` completo com tokens HSL ✅. Vou apenas revisar contraste do `--muted-foreground` no dark (atualmente 52% — pode ficar baixo) e ajustar se necessário, sem criar tokens novos.

## 3. Hook `useTheme`

Novo arquivo `src/hooks/useTheme.tsx` (Provider + hook):
- Lê `profile.theme_preference` do `AuthContext`.
- Estado local sincronizado; persiste fallback em `localStorage` (`theme`) para aplicar antes do profile carregar (evita flash).
- Resolve `'system'` via `window.matchMedia('(prefers-color-scheme: dark)')` com listener.
- Aplica/remove classe `dark` em `document.documentElement`.
- Expõe: `{ theme, resolvedTheme, setTheme(next) }`. `setTheme` faz `update profiles set theme_preference` e atualiza local.
- Inicialização inline no `index.html` (script pequeno) para aplicar tema do `localStorage` antes do React montar — evita flash branco.

## 4. Provider

Adicionar `<ThemeProvider>` em `src/App.tsx` logo dentro do `AuthProvider`.

## 5. UI

**Header (`AppHeader.tsx`)**: novo botão (ícone) ao lado do `NotificationCenter` que cicla `light → dark → system → light`. Ícone:
- light → `Sun`
- dark → `Moon`  
- system → `Monitor`
Tooltip indicando o modo atual.

**Página de perfil (`MeuPerfil.tsx`)**: nova seção "Aparência" com 3 botões/radio (Claro / Escuro / Sistema) usando o mesmo hook.

## 6. Revisão de contraste

Passar nos componentes principais para garantir uso de tokens semânticos (sem `bg-white`, `text-black` hardcoded). Foco em:
- `AppHeader`, `AppSidebar`, `Dashboard`, `MeuPerfil`, `NotificationCenter`, cards do dashboard.
- Substituir cores hardcoded por `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`.
- Não criar tokens novos.

## 7. Arquivos tocados (estimativa)

**Criados:**
- `src/hooks/useTheme.tsx`
- `supabase/migrations/<timestamp>_theme_preference.sql`

**Editados:**
- `src/App.tsx` (envolver com ThemeProvider)
- `index.html` (script anti-flash)
- `src/components/AppHeader.tsx` (botão de tema)
- `src/pages/MeuPerfil.tsx` (seção Aparência)
- `src/integrations/supabase/types.ts` (auto após migração)
- `src/index.css` (ajuste fino de `--muted-foreground` dark se necessário)
- Eventuais componentes com cores hardcoded encontrados na revisão.

## Regras respeitadas
- Único commit reversível.
- Reuso total dos tokens existentes (`bg-background`, `text-foreground`, etc.).
- Sem variáveis de cor novas.
- RLS intacto.

Aprova?
