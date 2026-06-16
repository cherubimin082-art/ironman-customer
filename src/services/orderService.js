import api from './api';

const ICON_MAP = {
  'Shirt': '👔',
  'T-Shirt': '👕',
  'Trousers': '👖',
  'Saree': '🥻',
  'Kurta': '👘',
  'Suit (2pc)': '🤵',
  'Dress': '👗',
  'Jacket': '🧥',
  'Bed Sheet': '🛏️',
  'Towel': '🧺',
  'Pant': '👖',
};

const BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg';
const FALLBACK_GARMENTS = [
  { id: 1,  name: 'Shirt',      price: 15, category: 'Tops',      icon: '👔', image_url: `${BASE}/1f454.svg` },
  { id: 2,  name: 'T-Shirt',    price: 12, category: 'Tops',      icon: '👕', image_url: `${BASE}/1f455.svg` },
  { id: 3,  name: 'Dress',      price: 30, category: 'Tops',      icon: '👗', image_url: `${BASE}/1f457.svg` },
  { id: 4,  name: 'Trousers',   price: 20, category: 'Bottoms',   icon: '👖', image_url: `${BASE}/1f456.svg` },
  { id: 5,  name: 'Saree',      price: 50, category: 'Ethnic',    icon: '🥻', image_url: `${BASE}/1f97b.svg` },
  { id: 6,  name: 'Kurta',      price: 18, category: 'Ethnic',    icon: '👘', image_url: `${BASE}/1f458.svg` },
  { id: 7,  name: 'Suit (2pc)', price: 80, category: 'Formal',    icon: '🤵', image_url: `${BASE}/1f935.svg` },
  { id: 8,  name: 'Jacket',     price: 35, category: 'Outerwear', icon: '🧥', image_url: `${BASE}/1f9e5.svg` },
  { id: 9,  name: 'Bed Sheet',  price: 40, category: 'Linen',     icon: '🛏️', image_url: `${BASE}/1f6cf.svg` },
  { id: 10, name: 'Towel',      price: 10, category: 'Linen',     icon: '🧺', image_url: `${BASE}/1f9fa.svg` },
  { id: 11, name: 'Pant',       price: 30, category: 'Bottoms',   icon: '👖', image_url: `${BASE}/1f456.svg` },
];

export const fetchCatalogue = async () => {
  try {
    const { data } = await api.get('/garments');
    return data.garments.map((g) => ({
      id: g.id,
      name: g.name,
      price: parseFloat(g.price),
      category: g.category,
      icon: g.icon || ICON_MAP[g.name] || '🧺',
      image_url: g.image_url || null,
    }));
  } catch {
    return FALLBACK_GARMENTS;
  }
};

export const fetchTimeSlots = async () => [
  '7:00 AM – 9:00 AM',
  '9:00 AM – 11:00 AM',
  '11:00 AM – 1:00 PM',
  '2:00 PM – 4:00 PM',
  '4:00 PM – 6:00 PM',
  '6:00 PM – 8:00 PM',
];
