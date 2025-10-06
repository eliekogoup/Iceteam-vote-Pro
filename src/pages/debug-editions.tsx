import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";

export default function TestDebugPage() {
  const { user, member } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    async function runDiagnostic() {
      setLoading(true);
      const info: any = {
        user: user,
        member: member,
        steps: []
      };

      try {
        // Test 1: Vérifier la connexion
        info.steps.push("🔍 Test connexion base de données...");
        const { data: testConnection } = await supabase
          .from('members')
          .select('count')
          .limit(1);
        info.connectionOK = !!testConnection;

        // Test 2: Rechercher le membre
        info.steps.push(`🔍 Recherche du membre avec email: ${user.email}`);
        const { data: memberFound, error: memberError } = await supabase
          .from('members')
          .select('id, email, nom, prenom')
          .eq('email', user.email)
          .single();
        
        info.memberFound = memberFound;
        info.memberError = memberError;

        if (memberFound) {
          // Test 3: Rechercher les groupes du membre
          info.steps.push(`👥 Recherche des groupes du membre ID: ${memberFound.id}`);
          const { data: memberGroups, error: groupsError } = await supabase
            .from('member_groups')
            .select('group_id, groups(id, name)')
            .eq('member_id', memberFound.id);
          
          info.memberGroups = memberGroups;
          info.groupsError = groupsError;

          if (memberGroups && memberGroups.length > 0) {
            const groupIds = memberGroups.map((mg: any) => mg.group_id);
            
            // Test 4: Rechercher les éditions pour ces groupes
            info.steps.push(`📊 Recherche des éditions pour les groupes: [${groupIds.join(', ')}]`);
            const { data: editions, error: editionsError } = await supabase
              .from('editions')
              .select('id, title, description, group_id, no_self_vote')
              .in('group_id', groupIds);
            
            info.editions = editions;
            info.editionsError = editionsError;
          }
        }

        // Test 5: Lister tous les membres pour comparaison
        info.steps.push("📋 Liste de tous les membres (debug)");
        const { data: allMembers } = await supabase
          .from('members')
          .select('id, email, nom, prenom')
          .limit(10);
        info.allMembers = allMembers;

        // Test 6: Lister toutes les éditions
        info.steps.push("📊 Liste de toutes les éditions (debug)");
        const { data: allEditions } = await supabase
          .from('editions')
          .select('id, title, group_id')
          .limit(10);
        info.allEditions = allEditions;

      } catch (error) {
        info.error = error;
      }

      setDebugInfo(info);
      setLoading(false);
    }

    runDiagnostic();
  }, [user, member]);

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>🔧 Test de diagnostic en cours...</h1>
        <p>Veuillez patienter pendant que nous testons la connexion aux données.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>🔧 Diagnostic des Éditions</h1>
      
      <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
        <h3>Informations utilisateur:</h3>
        <pre>{JSON.stringify({ 
          userEmail: debugInfo.user?.email,
          member: debugInfo.member 
        }, null, 2)}</pre>
      </div>

      <div style={{ background: '#e8f5e8', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
        <h3>Étapes de diagnostic:</h3>
        {debugInfo.steps?.map((step: string, idx: number) => (
          <div key={idx}>✓ {step}</div>
        ))}
      </div>

      <div style={{ background: '#fff3cd', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
        <h3>Résultats:</h3>
        <p><strong>Connexion DB:</strong> {debugInfo.connectionOK ? '✅ OK' : '❌ Erreur'}</p>
        <p><strong>Membre trouvé:</strong> {debugInfo.memberFound ? '✅ Oui' : '❌ Non'}</p>
        {debugInfo.memberError && (
          <p><strong>Erreur membre:</strong> <code>{JSON.stringify(debugInfo.memberError)}</code></p>
        )}
        <p><strong>Groupes trouvés:</strong> {debugInfo.memberGroups?.length || 0}</p>
        <p><strong>Éditions trouvées:</strong> {debugInfo.editions?.length || 0}</p>
      </div>

      <details style={{ marginBottom: '1rem' }}>
        <summary><strong>📊 Détails membre trouvé</strong></summary>
        <pre style={{ background: '#f8f9fa', padding: '1rem' }}>
          {JSON.stringify(debugInfo.memberFound, null, 2)}
        </pre>
      </details>

      <details style={{ marginBottom: '1rem' }}>
        <summary><strong>👥 Détails groupes du membre</strong></summary>
        <pre style={{ background: '#f8f9fa', padding: '1rem' }}>
          {JSON.stringify(debugInfo.memberGroups, null, 2)}
        </pre>
      </details>

      <details style={{ marginBottom: '1rem' }}>
        <summary><strong>📋 Détails éditions trouvées</strong></summary>
        <pre style={{ background: '#f8f9fa', padding: '1rem' }}>
          {JSON.stringify(debugInfo.editions, null, 2)}
        </pre>
      </details>

      <details style={{ marginBottom: '1rem' }}>
        <summary><strong>🔍 Tous les membres dans la base</strong></summary>
        <pre style={{ background: '#f8f9fa', padding: '1rem' }}>
          {JSON.stringify(debugInfo.allMembers, null, 2)}
        </pre>
      </details>

      <details style={{ marginBottom: '1rem' }}>
        <summary><strong>📊 Toutes les éditions dans la base</strong></summary>
        <pre style={{ background: '#f8f9fa', padding: '1rem' }}>
          {JSON.stringify(debugInfo.allEditions, null, 2)}
        </pre>
      </details>

      {debugInfo.error && (
        <div style={{ background: '#f8d7da', padding: '1rem', borderRadius: '4px' }}>
          <h3>❌ Erreur:</h3>
          <pre>{JSON.stringify(debugInfo.error, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}