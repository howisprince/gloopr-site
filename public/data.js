// Static content for the site. No build step required.

const PACKAGES = {
  quick: {
    name: "Quick Shine",
    duration: "~1 hr",
    includes: ["Vacuum cleaning", "Shampoo washing", "Tyre polish", "Interior dusting"],
    pricing: {
      Hatchback: 349,
      Sedan: 399,
      "Compact SUV": 399,
      "5 Seater SUV": 449,
      "7 Seater SUV": 499,
    },
  },
  deep: {
    name: "Deep Cleaning",
    duration: "2–3 hrs",
    includes: ["Quick shine + interior polishing", "Door-dashboard-seat-roof-mats-trunk dry cleaning"],
    pricing: {
      Hatchback: 799,
      Sedan: 999,
      "Compact SUV": 999,
      "5 Seater SUV": 1199,
      "7 Seater SUV": 1399,
    },
  },
  rubbing: {
    name: "Rubbing & Polishing",
    duration: "2–3 hrs",
    includes: ["Shampoo wash", "Boot/roof buffing", "Doors-headlight-bonnet-sandpaper rubbing", "Exterior wax polishing"],
    pricing: {
      Hatchback: 1399,
      Sedan: 1599,
      "Compact SUV": 1599,
      "5 Seater SUV": 1699,
      "7 Seater SUV": 1799,
    },
  },
  windshield: {
    name: "Windshield Polish",
    duration: "~2 hrs",
    includes: ["Shampoo wash", "Windshield-headlight sandpaper rubbing", "Water-repellent coat"],
    pricing: {
      Hatchback: 799,
      Sedan: 999,
      "Compact SUV": 999,
      "5 Seater SUV": 1199,
      "7 Seater SUV": 1199,
    },
  },
};

const CAR_TYPES = ["Hatchback", "Sedan", "Compact SUV", "5 Seater SUV", "7 Seater SUV"];

const REVIEWS = [
  {
    name: "Rahul Sherewala",
    rating: 5,
    car: "Hyundai Creta",
    date: "2 weeks ago",
    text: "The team arrived on time and the car looked better than when I drove it out of the showroom. Staff were polite, professional, and explained every step. Worth every rupee.",
    city: "Jaipur",
  },
  {
    name: "Geeta Kumari",
    rating: 5,
    car: "Maruti Swift",
    date: "1 month ago",
    text: "Honestly didn't expect doorstep detailing to be this good. The deep clean got stains out of my fabric seats that I thought were permanent. Highly recommend for anyone on a budget.",
    city: "Jaipur",
  },
  {
    name: "Arjun Mehta",
    rating: 5,
    car: "Honda City",
    date: "3 days ago",
    text: "Booked the rubbing & polishing package for my 5-year-old City. The paint now looks fresh off the lot. They brought their own water and power — zero hassle.",
    city: "Jaipur",
  },
  {
    name: "Priya Sharma",
    rating: 4,
    car: "Tata Nexon",
    date: "1 week ago",
    text: "Quick shine was perfect for a Sunday morning. The tyre dressing is a nice touch. Took about 50 minutes as advertised.",
    city: "Jaipur",
  },
  {
    name: "Vikram Singh",
    rating: 5,
    car: "Toyota Fortuner",
    date: "2 months ago",
    text: "Got a full deep clean for the entire family SUV. Even the kids' crumbs in the third row were gone. Booking via WhatsApp was a breeze.",
    city: "Jaipur",
  },
  {
    name: "Sneha Patel",
    rating: 5,
    car: "Maruti Baleno",
    date: "5 days ago",
    text: "Windshield polish made driving in the rain so much better — water just beads off. Will definitely book again before monsoon.",
    city: "Jaipur",
  },
];

const FAQS = [
  {
    q: "Do you bring your own water and electricity?",
    a: "Yes. Our team arrives fully equipped with a portable water tank, power backup, and all cleaning supplies. We just need access to your parking spot.",
  },
  {
    q: "How long does a deep cleaning take?",
    a: "A Deep Cleaning service typically takes 2 to 3 hours depending on car size and condition. We'll give you a more precise estimate when we see the car.",
  },
  {
    q: "Is it safe for my car's paint?",
    a: "Absolutely. We use pH-balanced, automotive-grade products and microfiber tools. Our Rubbing & Polishing service is hand-done by trained technicians to avoid swirl marks.",
  },
  {
    q: "What if it rains after the wash?",
    a: "Light rain won't affect the finish. For Rubbing & Polishing, we apply a wax coat that beads water off. If you're unhappy with the result, we'll do a touch-up free of charge within 48 hours.",
  },
  {
    q: "Do you service my area?",
    a: "We currently cover the greater Jaipur metro area. Enter your address in the booking form and we'll confirm availability before sending anyone.",
  },
  {
    q: "Can I book a recurring plan?",
    a: "Yes — many of our regulars book a weekly or bi-weekly Quick Shine. Mention 'recurring' in the WhatsApp message after booking and we'll set it up for you.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Cash, UPI (GPay, PhonePe, Paytm), and bank transfer. Payment is collected only after the service is complete and you're satisfied.",
  },
  {
    q: "Do you offer interior-only packages?",
    a: "Our Deep Cleaning package already includes a full interior detail. For a lighter interior-only job, message us on WhatsApp and we'll quote you a custom rate.",
  },
];

const ADD_ONS = {
  vacuum: 199,
  tire: 99,
  engine: 299,
  ceramic: 499,
  leather: 249,
  pet: 199,
};
