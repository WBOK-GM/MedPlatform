export interface DepartmentCities {
  department: string;
  cities: string[];
}

export const COLOMBIA_DEPARTMENT_CITIES: DepartmentCities[] = [
  { department: 'Amazonas', cities: ['Leticia', 'Puerto Narino'] },
  { department: 'Antioquia', cities: ['Medellin', 'Bello', 'Itagui', 'Envigado', 'Rionegro'] },
  { department: 'Arauca', cities: ['Arauca', 'Saravena', 'Tame'] },
  { department: 'Atlantico', cities: ['Barranquilla', 'Soledad', 'Malambo', 'Puerto Colombia'] },
  { department: 'Bolivar', cities: ['Cartagena', 'Magangue', 'Turbaco', 'Arjona'] },
  { department: 'Boyaca', cities: ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquira', 'Paipa', 'Panqueba'] },
  { department: 'Caldas', cities: ['Manizales', 'La Dorada', 'Villamaria', 'Chinchina'] },
  { department: 'Caqueta', cities: ['Florencia', 'San Vicente del Caguan'] },
  { department: 'Casanare', cities: ['Yopal', 'Aguazul', 'Villanueva'] },
  { department: 'Cauca', cities: ['Popayan', 'Santander de Quilichao', 'Puerto Tejada'] },
  { department: 'Cesar', cities: ['Valledupar', 'Aguachica', 'Codazzi'] },
  { department: 'Choco', cities: ['Quibdo', 'Istmina', 'Condoto'] },
  { department: 'Cordoba', cities: ['Monteria', 'Sahagun', 'Lorica', 'Cerete'] },
  { department: 'Cundinamarca', cities: ['Soacha', 'Facatativa', 'Zipaquira', 'Chia', 'Fusagasuga'] },
  { department: 'Guainia', cities: ['Inirida'] },
  { department: 'Guaviare', cities: ['San Jose del Guaviare', 'Calamar'] },
  { department: 'Huila', cities: ['Neiva', 'Pitalito', 'Garzon', 'La Plata'] },
  { department: 'La Guajira', cities: ['Riohacha', 'Maicao', 'Uribia'] },
  { department: 'Magdalena', cities: ['Santa Marta', 'Cienaga', 'Fundacion'] },
  { department: 'Meta', cities: ['Villavicencio', 'Acacias', 'Granada'] },
  { department: 'Narino', cities: ['Pasto', 'Tumaco', 'Ipiales'] },
  { department: 'Norte de Santander', cities: ['Cucuta', 'Ocana', 'Villa del Rosario'] },
  { department: 'Putumayo', cities: ['Mocoa', 'Puerto Asis'] },
  { department: 'Quindio', cities: ['Armenia', 'Calarca', 'La Tebaida'] },
  { department: 'Risaralda', cities: ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal'] },
  { department: 'San Andres y Providencia', cities: ['San Andres', 'Providencia'] },
  { department: 'Santander', cities: ['Bucaramanga', 'Floridablanca', 'Giron', 'Piedecuesta', 'Barrancabermeja'] },
  { department: 'Sucre', cities: ['Sincelejo', 'Corozal', 'Sampues'] },
  { department: 'Tolima', cities: ['Ibague', 'Espinal', 'Melgar', 'Honda'] },
  { department: 'Valle del Cauca', cities: ['Cali', 'Palmira', 'Buenaventura', 'Tulua', 'Buga', 'Cartago'] },
  { department: 'Vaupes', cities: ['Mitu'] },
  { department: 'Vichada', cities: ['Puerto Carreno'] },
  { department: 'Bogota D.C.', cities: ['Bogota'] }
];

export const COLOMBIA_DEPARTMENTS = COLOMBIA_DEPARTMENT_CITIES.map((entry) => entry.department);

export function getCitiesByDepartment(department: string): string[] {
  return COLOMBIA_DEPARTMENT_CITIES.find((entry) => entry.department === department)?.cities || [];
}
