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


export const fetchCatalogue = async () => {
  const { data } = await api.get('/garments');
  return data.garments.map((g) => ({
    id:        g.id,
    name:      g.name,
    price:     parseFloat(g.price),
    category:  g.category,
    icon:      g.icon || ICON_MAP[g.name] || '🧺',
    image_url: g.image_url || null,
  }));
};

export const fetchApartments = async () => {
  const { data } = await api.get('/apartments');
  return data.apartments || [];
};

export const fetchTimeSlots = async () => [
  '7:00 AM – 9:00 AM',
  '9:00 AM – 11:00 AM',
  '11:00 AM – 1:00 PM',
  '2:00 PM – 4:00 PM',
  '4:00 PM – 6:00 PM',
  '6:00 PM – 8:00 PM',
];
