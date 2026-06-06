import { createTheme, alpha } from '@mui/material/styles';

/**
 * Theme configuration using US English for identifiers.
 *
 * makeTheme(mode) returns a Material-UI theme for the requested color mode.
 * The dark mode mirrors the product illustration (deep navy gradient canvas,
 * translucent "glass" panels, teal/cyan accent). The light ("bright") mode keeps
 * the same accent on a soft, airy surface.
 */

const ACCENT_FROM = '#2DD4BF';
const ACCENT_TO = '#22D3EE';
const ON_ACCENT = '#04201d';

function paletteFor(mode) {
  if (mode === 'light') {
    return {
      mode: 'light',
      primary: { main: '#0D9488', light: '#2DD4BF', dark: '#0F766E', contrastText: ON_ACCENT },
      secondary: { main: '#6366F1', contrastText: '#ffffff' },
      success: { main: '#059669' },
      error: { main: '#DC2626' },
      warning: { main: '#D97706' },
      info: { main: '#0284C7' },
      background: { default: '#eef3fb', paper: '#ffffff' },
      text: { primary: '#0F172A', secondary: '#475569' },
      divider: 'rgba(15,23,42,0.10)',
    };
  }
  return {
    mode: 'dark',
    primary: { main: '#2DD4BF', light: '#5EEAD4', dark: '#14B8A6', contrastText: ON_ACCENT },
    secondary: { main: '#818CF8', contrastText: '#0b1020' },
    success: { main: '#34D399' },
    error: { main: '#F87171' },
    warning: { main: '#FBBF24' },
    info: { main: '#38BDF8' },
    background: { default: '#0a0e1a', paper: '#111829' },
    text: { primary: '#E7ECF5', secondary: 'rgba(231,236,245,0.64)' },
    divider: 'rgba(255,255,255,0.10)',
  };
}

export function makeTheme(mode = 'dark') {
  const isDark = mode === 'dark';
  const palette = paletteFor(mode);

  const glassBg = isDark ? alpha('#16203a', 0.72) : alpha('#ffffff', 0.78);
  const glassBorder = palette.divider;
  const glassShadow = isDark ? '0 16px 40px rgba(2,6,23,0.45)' : '0 16px 40px rgba(15,23,42,0.10)';
  const inputBg = isDark ? alpha('#0b1020', 0.55) : alpha('#0f172a', 0.03);
  const hoverBorder = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.24)';

  const bodyBackground = isDark
    ? `radial-gradient(1200px 600px at 82% -12%, ${alpha(ACCENT_TO, 0.12)}, transparent 60%),
       radial-gradient(900px 520px at -10% 18%, ${alpha('#818CF8', 0.12)}, transparent 55%),
       linear-gradient(160deg, #0a0e1a 0%, #0d1426 52%, #0a1020 100%)`
    : `radial-gradient(1000px 520px at 85% -12%, ${alpha(ACCENT_FROM, 0.20)}, transparent 60%),
       radial-gradient(820px 480px at -8% 12%, ${alpha('#6366F1', 0.14)}, transparent 55%),
       linear-gradient(160deg, #eef3fb 0%, #f6f9fd 100%)`;

  const accentGradient = `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})`;

  return createTheme({
    palette,
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 700, letterSpacing: '-0.01em' },
      h5: { fontWeight: 700, letterSpacing: '-0.01em' },
      h6: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: { colorScheme: mode },
          body: {
            minHeight: '100vh',
            background: bodyBackground,
            backgroundAttachment: 'fixed',
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: 'transparent' },
        styleOverrides: {
          root: {
            background: glassBg,
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderBottom: `1px solid ${glassBorder}`,
            color: palette.text.primary,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            background: glassBg,
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: glassBg,
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: `1px solid ${glassBorder}`,
            boxShadow: glassShadow,
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 999, paddingInline: 18 },
          containedPrimary: {
            background: accentGradient,
            color: ON_ACCENT,
            boxShadow: `0 8px 24px ${alpha(ACCENT_TO, isDark ? 0.35 : 0.4)}`,
            '&:hover': {
              background: accentGradient,
              filter: 'brightness(1.06)',
              boxShadow: `0 10px 28px ${alpha(ACCENT_TO, 0.5)}`,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: inputBg,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: glassBorder },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: hoverBorder },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            marginInline: 8,
            '&.Mui-selected': {
              backgroundColor: alpha(ACCENT_TO, isDark ? 0.16 : 0.14),
              '&:hover': { backgroundColor: alpha(ACCENT_TO, isDark ? 0.22 : 0.2) },
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: glassBorder },
          head: { fontWeight: 700, color: palette.text.secondary, borderColor: glassBorder },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 8 },
        },
      },
    },
  });
}

const theme = makeTheme('dark');

export default theme;
