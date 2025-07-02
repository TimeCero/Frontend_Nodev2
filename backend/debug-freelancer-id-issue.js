require('dotenv').config();
const { supabase, isSupabaseConfigured } = require('./config/supabase');

if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

const debugFreelancerIdIssue = async () => {
  console.log('🔍 Investigando problema de IDs de freelancers...');

  if (!isSupabaseConfigured || !supabase) {
    console.error('❌ Supabase no está configurado');
    return;
  }

  try {
    // Verificar estructura de la tabla user_profiles
    console.log('\n📊 Consultando estructura de user_profiles...');
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_type', 'freelancer')
      .limit(3);

    if (error) {
      console.error('❌ Error al consultar user_profiles:', error.message);
      return;
    }

    console.log('✅ Freelancers encontrados:', profiles.length);
    profiles.forEach((profile, index) => {
      console.log(`\n  ${index + 1}. Freelancer:`);
      console.log(`     id: ${profile.id || 'NO EXISTE'}`);
      console.log(`     user_id: ${profile.user_id || 'NO EXISTE'}`);
      console.log(`     full_name: ${profile.full_name}`);
      console.log(`     email: ${profile.email}`);
      console.log(`     user_type: ${profile.user_type}`);
    });

    // Probar el endpoint problemático
    console.log('\n🧪 Probando endpoint /api/freelancers/:id/profile...');
    const testId = profiles[0]?.id || profiles[0]?.user_id;

    if (testId) {
      console.log(`📤 Probando con ID: ${testId}`);

      const response = await fetch(`${BACKEND_URL}/api/freelancers/${testId}/profile`);
      console.log('📊 Status:', response.status);

      const responseText = await response.text();
      console.log('📋 Response:', responseText);

      if (profiles[0]?.user_id && profiles[0]?.user_id !== profiles[0]?.id) {
        console.log(`\n📤 Probando con user_id: ${profiles[0].user_id}`);
        const response2 = await fetch(`${BACKEND_URL}/api/freelancers/${profiles[0].user_id}/profile`);
        console.log('📊 Status:', response2.status);
        const responseText2 = await response2.text();
        console.log('📋 Response:', responseText2);
      }
    }

    console.log('\n💬 Campo correcto para mensajes directos:');
    console.log('   - La tabla direct_messages usa: sender_id y recipient_id');
    console.log('   - Estos deben referenciar: user_profiles.user_id');
    console.log('   - El frontend debería usar: user_id (no id)');

  } catch (err) {
    console.error('❌ Error general:', err.message);
  }
};

debugFreelancerIdIssue();
