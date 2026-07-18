// src/data/fleetData.js
export const categories = [
    {
      id: 'trucks',
      name: 'Trucks',
      subcategories: [
        { id: 'trucks-heavy', name: 'Heavy Duty' },
        { id: 'trucks-light', name: 'Light Duty' },
      ],
    },
    {
      id: 'vans',
      name: 'Vans',
      subcategories: [
        { id: 'vans-cargo', name: 'Cargo' },
        { id: 'vans-passenger', name: 'Passenger' },
      ],
    },
    {
      id: 'cars',
      name: 'Cars',
      subcategories: [
        { id: 'cars-sedan', name: 'Sedan' },
        { id: 'cars-suv', name: 'SUV' },
      ],
    },
  ]
  
  export const initialVehicles = [
    {
      id: '1',
      subcategoryId: 'trucks-heavy',
      licensePlate: 'TX-4821',
      make: 'Ford',
      model: 'F-350',
      status: 'Active',
    },
    {
      id: '2',
      subcategoryId: 'vans-cargo',
      licensePlate: 'CA-9910',
      make: 'Mercedes',
      model: 'Sprinter',
      status: 'Maintenance',
    },
  ]
  
  export const vehicleStatuses = ['Active', 'Maintenance', 'Retired', 'Out of Service']