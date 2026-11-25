// Only publish verified business details. Empty values are intentionally hidden.
export const business = {
  name: 'Swift Air Care',
  domain: 'swiftaircare.com',
  phone: '',
  email: '',
  hours: '',
  serviceArea: 'Greater Toronto Area & nearby communities',
  // Set to the HTTPS Formspree endpoint created for the business.
  // Public form identifiers are safe here; never add API secrets.
  bookingEndpoint: '',
};

export const services = [
  {
    slug: 'heating', icon: 'flame', name: 'Heating', tag: 'Warmth when it matters',
    summary: 'Furnace repairs, installation, and seasonal maintenance. Get help with heating problems or plan a replacement.',
    heading: 'Furnace repairs, installation & service.',
    intro: 'When your home isn’t heating the way it should, let’s find out why. Swift Air Care helps GTA homeowners with furnace issues, replacement options, and seasonal maintenance.',
    items: ['Furnace troubleshooting and repairs', 'Furnace replacement and installation', 'Seasonal heating maintenance', 'Thermostat and comfort concerns'],
    signs: ['Your furnace isn’t producing enough heat', 'Some rooms feel colder than others', 'Your system cycles on and off frequently', 'You’re planning to replace an older furnace'],
  },
  {
    slug: 'air-conditioning', icon: 'snow', name: 'Air conditioning', tag: 'Your cool, calm retreat',
    summary: 'Air conditioner repairs, replacement systems, and tune-ups for homes that need reliable cooling.',
    heading: 'Air conditioning repairs & installation.',
    intro: 'From a system that won’t cool to a new installation, tell us what’s happening. We’ll help you understand the next step for your home’s air conditioning.',
    items: ['Air conditioner diagnostics and repairs', 'Central air conditioning installation', 'Seasonal cooling tune-ups', 'Cooling and airflow concerns'],
    signs: ['Your air conditioner is blowing warm air', 'Cooling feels uneven from room to room', 'Your system has become unusually noisy', 'You want to discuss replacement options'],
  },
  {
    slug: 'heat-pumps', icon: 'cycle', name: 'Heat pumps', tag: 'Comfort through the seasons',
    summary: 'Heat pump installation and service, with advice on options for your home and existing system.',
    heading: 'Heat pump installation & service.',
    intro: 'Thinking about a heat pump? Start with a conversation about your home, your current equipment, and the comfort you’re looking for. We’ll help you explore suitable options.',
    items: ['Heat pump installation consultations', 'Heat pump service and troubleshooting', 'Ductless heating and cooling options', 'System sizing and replacement discussions'],
    signs: ['You want to explore heating and cooling together', 'You’re considering a ductless system', 'Your existing heat pump needs attention', 'You’re comparing options for a home upgrade'],
  },
  {
    slug: 'maintenance', icon: 'tool', name: 'Maintenance & air care', tag: 'A little care goes a long way',
    summary: 'Seasonal system care, filter and airflow checks, and help with indoor air concerns.',
    heading: 'HVAC maintenance & indoor air care.',
    intro: 'Every season asks something different of your HVAC system. Schedule a maintenance visit to discuss performance, routine care, and the air moving through your home.',
    items: ['Seasonal furnace and AC maintenance', 'Filter and airflow checks', 'Humidifier and indoor air consultations', 'Thermostat setup and comfort adjustments'],
    signs: ['Your system is due for seasonal maintenance', 'Airflow seems weaker than usual', 'You want help with filter care', 'Your home feels too dry or uncomfortable'],
  },
];
