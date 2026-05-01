import React from "react";

type Variant = "light" | "red" | "brown" | "dark";
type Size = "sm" | "md" | "lg";

interface Props {
  variant?: Variant;
  size?: Size;
  className?: string;
  /** Se true usa o PNG pronto do lockup completo. Se false renderiza selo + logo separados (mais flexível). */
  usePreset?: boolean;
}

const PRESET_BY_VARIANT: Record<Variant, string> = {
  light: "/logos/conecta_lockup/conecta_curio_claro.png",
  red: "/logos/conecta_lockup/conecta_curio_vermelho.png",
  brown: "/logos/conecta_lockup/conecta_curio_marrom.png",
  dark: "/logos/conecta_lockup/conecta_curio_escuro.png",
};

const LOGO_BY_VARIANT: Record<Variant, string> = {
  light: "/logos/curio_logo_claro.png",
  red: "/logos/curio_logo_vermelho.png",
  brown: "/logos/curio_logo_vermelho.png",
  dark: "/logos/curio_logo_escuro.png",
};

const PILL_COLORS: Record<Variant, { color: string; border: string }> = {
  light: { color: "#B63533", border: "#B63533" },
  red: { color: "#FFFFFF", border: "#FFFFFF" },
  brown: { color: "#F7F7F8", border: "#F7F7F8" },
  dark: { color: "#FFFFFF", border: "#FFFFFF" },
};

const SIZES: Record<
  Size,
  { logoH: number; font: number; pad: string; spacing: number; gap: number }
> = {
  sm: { logoH: 32, font: 9, pad: "5px 11px", spacing: 3, gap: 12 },
  md: { logoH: 64, font: 12, pad: "9px 18px", spacing: 4, gap: 22 },
  lg: { logoH: 110, font: 14, pad: "11px 22px", spacing: 4.5, gap: 28 },
};

export default function ConectaLockup({
  variant = "light",
  size = "md",
  className = "",
  usePreset = false,
}: Props) {
  if (usePreset) {
    const heightMap = { sm: 64, md: 120, lg: 180 } as const;
    return (
      <img
        src={PRESET_BY_VARIANT[variant]}
        alt="Conecta Curió"
        style={{ height: heightMap[size], width: "auto", display: "block" }}
        className={className}
      />
    );
  }

  const pill = PILL_COLORS[variant];
  const sz = SIZES[size];

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: sz.gap,
      }}
    >
      <span
        style={{
          fontSize: sz.font,
          letterSpacing: `${sz.spacing}px`,
          fontWeight: 600,
          textTransform: "uppercase",
          color: pill.color,
          border: `1.2px solid ${pill.border}`,
          padding: sz.pad,
          borderRadius: 999,
          fontFamily: "Poppins, Inter, system-ui, sans-serif",
          lineHeight: 1,
        }}
      >
        Conecta
      </span>
      <img
        src={LOGO_BY_VARIANT[variant]}
        alt="Curió Supermercados"
        style={{ height: sz.logoH, width: "auto", display: "block" }}
      />
    </div>
  );
}
