/**
 * Every piece of editorial copy, link and product fact on the site.
 * Facts come from @freshcan.ec on Instagram; each image records its source post.
 * Leave a field null rather than inventing a value.
 */

/** File name (without extension) in src/assets/media. */
export type MediaKey =
  | "can-moments"
  | "can-picnic"
  | "esencia"
  | "nuevo-spot"
  | "urban-market"
  | "coco-lata"
  | "formatos"
  | "brindis"
  | "runner"
  | "stack"
  | "padel";

export interface Media {
  key: MediaKey;
  alt: string;
  /** CSS object-position, e.g. "50% 30%". */
  focus: string;
  /** Where the image was published. */
  source: string;
}

export interface Link {
  label: string;
  href: string;
  external?: boolean;
}

export interface Format {
  id: "250" | "330" | "500";
  ml: number;
  /** Creative copy about the occasion, not a product claim. */
  line: string;
  /** Can proportions for the 3D model, relative to the 330 ml can. */
  heightScale: number;
  widthScale: number;
  tone: "steel" | "husk" | "palm";
}

export interface Moment {
  title: string;
  handle: string;
  caption: string;
  href: string;
  media: MediaKey;
}

export interface Spot {
  name: string;
  verified: boolean;
  address?: string;
  mapsHref?: string;
  instagram?: string;
}

const whatsappNumber = "593939941356";
const instagramUrl = "https://www.instagram.com/freshcan.ec/";

export const content = {
  brand: {
    name: "Fresh Can",
    handle: "@freshcan.ec",
    country: "Ecuador",
    tagline: "Directo del coco a tu lata",
    bio: ["Fresh coconut water", "Natural hydration", "Bebidas naturales en latas PET", "Directo del coco a tu lata"],
  },

  seo: {
    title: "Fresh Can — 100% agua de coco en lata transparente",
    description:
      "Fresh Can: 100% agua de coco en latas PET transparentes. 250, 330 y 500 ml. Pídela por WhatsApp o encuéntrala en The Urban Market, Samborondón.",
    canonical: "https://freshcan.ec/",
    locale: "es_EC",
    lang: "es",
    ogImage: "can-moments" as MediaKey,
    themeColor: "#f4f6f5",
  },

  contact: {
    whatsappNumber,
    whatsappDisplay: "+593 93 994 1356",
    whatsappGreeting: "Hola Fresh Can 👋",
    instagram: instagramUrl,
    email: null as string | null,
  },

  nav: {
    menuLabel: "Menú",
    closeLabel: "Cerrar",
    skipLabel: "Saltar al contenido",
    items: [
      { label: "Inicio", href: "#inicio" },
      { label: "La lata", href: "#la-lata" },
      { label: "Formatos", href: "#formatos" },
      { label: "Moments", href: "#moments" },
      { label: "Ruta Fresh", href: "#ruta-fresh" },
    ] satisfies Link[],
    contactTitle: "Escríbenos",
  },

  loader: {
    unit: "ml",
    target: 330,
    label: "Llenando tu lata",
  },

  hero: {
    titleTop: "100% coco",
    titleBottom: "100% fresh.",
    sticker: "Directo del coco a tu lata · Natural hydration · ",
    bullets: ["Agua de coco", "En lata PET transparente"],
    body: "La esencia del coco, en una nueva forma de llevarla contigo. Así de simple.",
    cta: { label: "Pide la tuya", href: "#formatos" } satisfies Link,
    canAlt: "Lata transparente de Fresh Can con agua de coco",
  },

  scene: {
    titleLines: ["Lo que ves", "es lo que", "tomas."],
    body: "Una lata transparente para que veas lo único que lleva adentro: agua de coco. Nada que esconder.",
    badges: [
      { value: "100%", label: "Agua de coco" },
      { value: "PET", label: "Lata transparente" },
      { value: "3", label: "Presentaciones" },
      { value: ".ec", label: "Hecho en Ecuador" },
    ],
    progress: { from: "Coco", to: "Lata", unit: "ml", max: 330 },
    photo: {
      key: "coco-lata",
      alt: "Cocos verdes, detalle de una foto de Fresh Can con el texto 100% agua de coco en una lata",
      // Top-right of the photo: only the coconuts, never the photographed can
      focus: "92% 0%",
      source: "https://www.instagram.com/freshcan.ec/p/DdaN7g8tvex/",
    } satisfies Media,
  },

  break: {
    left: "Agarra",
    right: "tu Fresh Can",
  },

  manifesto: {
    before: "100% agua de coco. Natural hydration, en una lata",
    words: ["fresh", "transparente", "para ti"],
    after: "directo del coco.",
    note: "Lo natural no necesita cambiar. Solo evolucionar.",
  },

  formats: {
    eyebrow: "3 presentaciones",
    title: ["Una misma", "esencia"],
    intro: "Fresh Can se adapta a ti, a tu plan y a cada ocasión. Listas para destapar en cada momento.",
    orderTitle: "Arma tu pedido",
    orderNote: "Te respondemos por WhatsApp con precio y entrega.",
    quantityLabel: "Cantidad",
    orderCta: "Pedir por WhatsApp",
    items: [
      { id: "250", ml: 250, line: "Para la lonchera, el bolso o el picnic.", heightScale: 0.74, widthScale: 0.92, tone: "steel" },
      { id: "330", ml: 330, line: "La de siempre. Del gym a la cancha.", heightScale: 1, widthScale: 1, tone: "husk" },
      { id: "500", ml: 500, line: "Para compartir, o para no compartir.", heightScale: 1.34, widthScale: 1.04, tone: "palm" },
    ] satisfies Format[],
    photo: {
      key: "formatos",
      alt: "Las tres presentaciones de Fresh Can: latas transparentes de 250, 330 y 500 ml",
      focus: "50% 55%",
      source: "https://www.instagram.com/freshcan.ec/p/Ddm2pzUz6OT/",
    } satisfies Media,
  },

  collage: {
    title: ["Planes que", "se sienten", "mejor"],
    body: "Picnic en el parque, una sesión de pádel, el after del gym. Acompañamos todos tus momentos.",
    cta: { label: "Ver en Instagram", href: instagramUrl, external: true } satisfies Link,
    photos: [
      { key: "can-picnic", alt: "Lata de Fresh Can junto a una canasta de picnic, mango y un sánduche", focus: "50% 50%", source: "https://www.instagram.com/freshcan.ec/p/DeM54mAljui/" },
      { key: "padel", alt: "Jugadora de pádel sacando en una cancha cubierta durante un evento con Fresh Can", focus: "50% 40%", source: "https://www.instagram.com/granitec_ec/p/DdUeLWhlpdc/" },
      { key: "esencia", alt: "Dos chicas espalda con espalda en un parque, una sostiene un coco verde y la otra una Fresh Can", focus: "55% 40%", source: "https://www.instagram.com/freshcan.ec/p/DeAFA0WiDG9/" },
      { key: "runner", alt: "Atleta con gafas deportivas tomando una Fresh Can después de entrenar", focus: "40% 35%", source: "https://www.instagram.com/rawadvance/p/Ddy_KtyERjg/" },
    ] satisfies Media[],
  },

  moments: {
    title: "#FreshCanMoments",
    hint: "Arrastra",
    prev: "Anterior",
    next: "Siguiente",
    items: [
      { title: "¡Refrescamos el Hell Day 2026!", handle: "@pushgym.ec", caption: "Hidratando a quienes se atrevieron a superar sus límites.", href: "https://www.instagram.com/freshcan.ec/reel/Def2kbJtjvV/", media: "runner" },
      { title: "Parte de la comunidad", handle: "@rawadvance", caption: "@freshcan.ec es parte de esta comunidad.", href: "https://www.instagram.com/rawadvance/p/Ddy_KtyERjg/", media: "brindis" },
      { title: "¡Hemos llegado!", handle: "@theurbanmarket.ec", caption: "A un nuevo spot: Plaza Lagos Town Center.", href: "https://www.instagram.com/freshcan.ec/p/Dd2UYS8FtNC/", media: "nuevo-spot" },
      { title: "Al challenge y a la cancha", handle: "@granitec_ec", caption: "Las mamás del Menor le dieron todo al challenge.", href: "https://www.instagram.com/granitec_ec/p/DdUeLWhlpdc/", media: "stack" },
      { title: "Picnic en el parque", handle: "@freshcan.ec", caption: "Planes que se sienten mejor con Fresh Can.", href: "https://www.instagram.com/freshcan.ec/p/DeM54mAljui/", media: "can-picnic" },
      { title: "La misma esencia", handle: "@freshcan.ec", caption: "Lo natural no necesita cambiar. Solo evolucionar.", href: "https://www.instagram.com/freshcan.ec/p/DeAFA0WiDG9/", media: "esencia" },
    ] satisfies Moment[],
  },

  ruta: {
    eyebrow: "Ruta Fresh",
    title: ["Encuéntrala", "cerca de ti."],
    body: "Un recorrido por los lugares donde puedes encontrar Fresh Can. O pídela directo por WhatsApp.",
    retailerLabel: "Official retailer",
    spotsLabel: "Spots en nuestra Ruta Fresh",
    spotsNote: "Destacados en nuestro Instagram.",
    ctaPrimary: "Pedir por WhatsApp",
    ctaSecondary: { label: "Ver la Ruta en Instagram", href: instagramUrl, external: true } satisfies Link,
    carouselLabel: "Presentaciones",
    retailer: {
      name: "The Urban Market",
      verified: true,
      address: "Plaza Lagos Town Center, Vía Puntilla Km 6.5, Samborondón",
      mapsHref: "https://www.google.com/maps/search/?api=1&query=The+Urban+Market+Plaza+Lagos+Samborond%C3%B3n",
      instagram: "https://www.instagram.com/theurbanmarket.ec/",
    } satisfies Spot,
    spots: ["Padel Point", "KO", "WePadel", "Casa Nua", "Jump and Pump", "KLŪB Wellness", "Yoga Shala", "ONNA", "OAHU"].map(
      (name): Spot => ({ name, verified: false }),
    ),
  },

  game: {
    intro: "Abre el coco",
    hint: "Desliza para abrir",
    scoreLabel: "ml",
    goal: 500,
    win: "¡Fresh!",
    restart: "Otra vez",
    a11yNote: "Mini juego decorativo: desliza sobre los cocos para llenar la lata.",
  },

  footer: {
    tagline: "Directo del coco a tu lata.",
    sub: "Bebidas naturales en latas PET.",
    madeIn: "Hecho en Ecuador",
    credit: "Sitio conceptual. Imágenes de @freshcan.ec y socios en Instagram.",
    backToTop: "Volver arriba",
  },
} as const;

export type Content = typeof content;

export function whatsappHref(message?: string): string {
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${whatsappNumber}${text}`;
}

export function orderMessage(format: Pick<Format, "ml">, quantity: number): string {
  const qty = Math.max(1, Math.floor(quantity));
  const unit = qty === 1 ? "lata" : "latas";
  return `${content.contact.whatsappGreeting} Quiero pedir ${qty} ${unit} de ${format.ml} ml.`;
}
