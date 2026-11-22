export type Vendor = {
  number: string;
  name: string;
  slogan: string;
  category: string;
  offerings: string[];
  note?: string;
  logo: string;
};

export const vendors: Vendor[] = [
  {
    number: "01",
    name: "Soul & Smoke",
    slogan: "Slow-smoked BBQ. Big festival flavor.",
    category: "Food · Barbecue",
    offerings: ["Brisket sandwiches", "Pulled pork", "Rib tips", "Mac + cheese"],
    logo: "/extra/Logo 1.png",
  },
  {
    number: "02",
    name: "La Cocinita Food Truck",
    slogan: "Latin street food with a Chicago twist.",
    category: "Food · Latin Street Food",
    offerings: ["Arepas", "Tacos", "Caribbean bowls", "Plantains", "Churros"],
    logo: "/extra/Logo 2.png",
  },
  {
    number: "03",
    name: "Kona Ice of Norwood Park",
    slogan: "Cool down with a colorful tropical treat.",
    category: "Dessert · Shaved Ice",
    offerings: ["Blue Raspberry", "Tiger's Blood", "Groovy Grape", "Monster Mango"],
    logo: "/extra/Logo 3.png",
  },
  {
    number: "04",
    name: "The Spin of It",
    slogan: "A little sweetness, a lot of fun.",
    category: "Sweets · Interactive Treats",
    offerings: ["Cotton candy", "Mini donuts", "Lemonade", "Dirty sodas"],
    logo: "/extra/Logo 4.png",
  },
  {
    number: "05",
    name: "Tacos Las Manitas",
    slogan: "Fresh local tacos made with intention.",
    category: "Food · Tacos",
    offerings: ["Taco bar"],
    note: "Specific proteins, sides, and prices are still to be confirmed.",
    logo: "/extra/Logo 5.png",
  },
  {
    number: "06",
    name: "Faces in Focus",
    slogan: "Turn little faces into works of art.",
    category: "Kids Activities · Face Painting",
    offerings: ["Face painting"],
    note: "The company also offers caricatures and airbrush tattoos.",
    logo: "/extra/Logo 6.png",
  },
  {
    number: "07",
    name: "APF Entertainment",
    slogan: "Twists, shapes and smiles for all ages.",
    category: "Kids Activities · Balloon Art",
    offerings: ["Balloon animals", "Flowers", "Swords", "Custom shapes"],
    logo: "/extra/Logo 7.png",
  },
  {
    number: "08",
    name: "Chicago Signs & Screen Printing",
    slogan: "Wear your Chicago creativity.",
    category: "Merch · Custom Apparel",
    offerings: ["Custom T-shirts", "Screen printing", "Embroidery", "Signs"],
    logo: "/extra/Logo 8.png",
  },
  {
    number: "09",
    name: "Snappy Printing + Graphics",
    slogan: "Small businesses, bold ideas, great prints.",
    category: "Merch · Print & Design",
    offerings: ["T-shirts", "Stickers", "Drinkware", "Banners", "Embroidery"],
    logo: "/extra/Logo 9.png",
  },
  {
    number: "10",
    name: "Bar La Rue",
    slogan: "A stylish adult-only beer stop.",
    category: "21+ Beer Area · Beverages",
    offerings: ["Stella Artois", "Bud Light", "Kronenbourg Blanc", "Deschutes Fresh Haze"],
    logo: "/extra/Logo 10.png",
  },
];
