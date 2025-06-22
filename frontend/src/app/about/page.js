'use client';
import { useState } from 'react';
import Navigation from '../components/Navigation';

export default function AboutPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Form submitted:', formData);
    setIsSubmitted(true);
    setFormData({ name: '', email: '', message: '' });
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  const teamMembers = [
    {
      name: "Carlos Méndez",
      role: "Fundador & CEO",
      bio: "Emprendedor tecnológico con 5 años de experiencia en desarrollo de plataformas digitales.",
      avatar: "https://media.istockphoto.com/id/1344688156/es/foto/retrato-de-un-hombre-usando-una-computadora-en-una-oficina-moderna.jpg?s=612x612&w=0&k=20&c=EBOt72kuzurni95Q8jIuOrfHbcK3Qr7w-Myb_O-FTKo="
    },
    {
      name: "Ana Rodríguez",
      role: "Diseñadora UX/UI",
      bio: "Especialista en experiencia de usuario con pasión por crear interfaces intuitivas.",
      avatar: "https://i.blogs.es/7e07d5/thisisengineering-raeng-64yrpkiguae-unsplash/450_1000.webp"
    },
    {
      name: "Diego Fernández",
      role: "Desarrollador Full Stack",
      bio: "Apasionado por construir soluciones escalables con las últimas tecnologías.",
      avatar: "https://media.istockphoto.com/id/1017296544/es/foto/pruebas-de-software.jpg?s=612x612&w=0&k=20&c=Qt-MHvxhP-X0Nds0kFNOEgAjZ3k6hRpTKuFh598Dy94="
    }
  ];

  const technologies = [
    { name: "Next.js", icon: "🖥️", description: "Framework React para renderizado eficiente" },
    { name: "Node.js", icon: "⚙️", description: "Entorno de ejecución para nuestro backend" },
    { name: "Supabase", icon: "🗃️", description: "Base de datos en tiempo real y autenticación" },
    { name: "AWS", icon: "☁️", description: "Infraestructura cloud escalable y segura" },
    { name: "Tailwind CSS", icon: "🎨", description: "Framework CSS para diseño rápido y consistente" },
    { name: "TypeScript", icon: "📝", description: "JavaScript tipado para mayor robustez" }
  ];

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Hero Section */}
        <div className="py-20 px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-extrabold sm:text-5xl lg:text-6xl mb-6">
              Sobre <span className="text-yellow-300">Nosotros</span>
            </h1>
            <p className="text-xl opacity-90">
              Conectando talento con oportunidades en Latinoamérica a través de tecnología innovadora
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Who We Are Section */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Quiénes Somos
              </h2>
              <div className="mt-4 h-1 w-20 bg-blue-600 mx-auto"></div>
            </div>
            
            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
              <div className="p-8 md:p-12 lg:flex">
                <div className="lg:w-1/2">
                  <img 
                    src="https://img.freepik.com/fotos-premium/joven-desarrollador-software-serio-que-trabaja-frente-monitores-computadora_274679-40351.jpg" 
                    alt="Equipo trabajando" 
                    className="w-full h-auto rounded-lg object-cover"
                  />
                </div>
                <div className="lg:w-1/2 lg:pl-12 mt-8 lg:mt-0">
                  <p className="text-lg text-gray-600 mb-6">
                    Somos una startup joven fundada por profesionales apasionados por la tecnología y el trabajo remoto. 
                    Nuestro equipo combina experiencia en desarrollo de software, diseño de experiencia de usuario y 
                    emprendimiento digital.
                  </p>
                  <p className="text-lg text-gray-600">
                    Comenzamos como un proyecto estudiantil en 2022 y hoy nos hemos convertido en una plataforma 
                    confiable para freelancers y clientes en toda Latinoamérica, con miles de usuarios satisfechos.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Mission & Vision */}
          <section className="mb-20">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Mission Card */}
              <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-blue-600">
                <div className="flex items-center mb-6">
                  <div className="bg-blue-100 p-3 rounded-lg mr-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Misión</h3>
                </div>
                <p className="text-gray-600">
                  Conectar freelancers talentosos con oportunidades reales de trabajo, eliminando intermediarios abusivos y 
                  creando un ecosistema justo donde ambos lados puedan crecer profesionalmente.
                </p>
              </div>

              {/* Vision Card */}
              <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-purple-600">
                <div className="flex items-center mb-6">
                  <div className="bg-purple-100 p-3 rounded-lg mr-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Visión</h3>
                </div>
                <p className="text-gray-600">
                  Ser la plataforma de referencia para trabajo freelance en Latinoamérica, reconocida por su transparencia, 
                  facilidad de uso y compromiso con la satisfacción tanto de freelancers como de clientes.
                </p>
              </div>
            </div>
          </section>

          {/* Our Team */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Nuestro Equipo
              </h2>
              <div className="mt-4 h-1 w-20 bg-blue-600 mx-auto"></div>
              <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
                Conoce a las personas apasionadas que hacen posible esta plataforma
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    <img 
                      src={member.avatar} 
                      alt={member.name} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                    <p className="text-blue-600 font-medium mb-3">{member.role}</p>
                    <p className="text-gray-600">{member.bio}</p>
                    <div className="mt-4 flex space-x-4">
                      <a href="#" className="text-blue-500 hover:text-blue-700">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                        </svg>
                      </a>
                      <a href="#" className="text-blue-400 hover:text-blue-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-1.998v-2.861c0-1.881-2.002-1.722-2.002 0v2.861h-2v-6h2v1.093c.872-1.616 4-1.736 4 1.548v3.359z" />
                        </svg>
                      </a>
                      <a href="#" className="text-gray-600 hover:text-gray-900">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Technologies */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Tecnologías que Usamos
              </h2>
              <div className="mt-4 h-1 w-20 bg-blue-600 mx-auto"></div>
              <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
                Construimos nuestra plataforma con las herramientas más modernas y confiables
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {technologies.map((tech, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-4">{tech.icon}</span>
                    <h3 className="text-xl font-bold text-gray-900">{tech.name}</h3>
                  </div>
                  <p className="text-gray-600">{tech.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}