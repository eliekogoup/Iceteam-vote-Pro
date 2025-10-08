import { createClient } from './supabase-auth'

// Vérifier si une édition est terminée (tous les membres ont voté)
export async function checkEditionStatus(editionId: number) {
  const supabase = createClient()
  
  try {
    console.log(`📊 Vérification du statut de l'édition ${editionId}...`);
    
    // D'abord récupérer l'édition pour connaître son groupe
    const { data: edition, error: editionError } = await supabase
      .from('editions')
      .select('group_id')
      .eq('id', editionId)
      .single()
    
    if (editionError || !edition) {
      console.error('❌ Édition non trouvée:', editionError);
      return { isComplete: false, totalMembers: 0, totalVoters: 0, progress: 0 }
    }

    // Récupérer tous les membres actifs du groupe de cette édition
    const { data: groupMembers, error: membersError } = await supabase
      .from('member_groups')
      .select(`
        member_id,
        members!inner(id, is_active)
      `)
      .eq('group_id', edition.group_id)
    
    if (membersError) {
      console.error('❌ Erreur récupération membres du groupe:', membersError);
      return { isComplete: false, totalMembers: 0, totalVoters: 0, progress: 0 }
    }

    // Filtrer les membres actifs
    const activeMembers = groupMembers?.filter(mg => 
      mg.members && mg.members.is_active !== false
    ) || []
    
    console.log(`👥 Membres actifs du groupe ${edition.group_id}:`, activeMembers.length);

    // Récupérer tous les votes pour cette édition (compter les votants uniques)
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('voter_id')
      .eq('edition_id', editionId)
    
    if (votesError) {
      console.error('❌ Erreur récupération votes:', votesError);
      return { isComplete: false, totalMembers: activeMembers.length, totalVoters: 0, progress: 0 }
    }

    // Créer un Set des membres qui ont voté pour éviter les doublons
    const votersSet = new Set(votes?.map(vote => vote.voter_id) || [])
    
    const totalMembers = activeMembers.length
    const totalVoters = votersSet.size
    const progress = totalMembers > 0 ? (totalVoters / totalMembers) * 100 : 0
    
    console.log(`📊 Statut édition ${editionId}: ${totalVoters}/${totalMembers} votes (${Math.round(progress)}%)`);
    
    return {
      isComplete: totalMembers > 0 && totalVoters >= totalMembers,
      totalMembers,
      totalVoters,
      progress
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du statut de l\'édition:', error)
    return {
      isComplete: false,
      totalMembers: 0,
      totalVoters: 0,
      progress: 0
    }
  }
}

// Vérifier si un membre a déjà voté pour une édition
export async function checkUserVoteStatus(editionId: number, memberEmail: string) {
  const supabase = createClient()
  
  try {
    // Récupérer l'ID du membre à partir de son email
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id')
      .eq('email', memberEmail)
      .single()
    
    if (memberError || !member) {
      return { hasVoted: false, memberId: null }
    }

    // Vérifier si ce membre a voté pour cette édition
    const { data: vote, error: voteError } = await supabase
      .from('votes')
      .select('id')
      .eq('edition_id', editionId)
      .eq('member_id', member.id)
      .single()
    
    return {
      hasVoted: !voteError && !!vote,
      memberId: member.id
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du vote de l\'utilisateur:', error)
    return { hasVoted: false, memberId: null }
  }
}

// Vérifier si un membre a déjà voté pour une édition (par ID de membre)
export async function checkUserVoteStatusByMemberId(editionId: number, memberId: number) {
  const supabase = createClient()
  
  try {
    console.log(`🗳️ Vérification vote pour membre ${memberId} sur édition ${editionId}...`);
    
    // Vérifier si ce membre a voté pour cette édition
    const { data: votes, error: voteError } = await supabase
      .from('votes')
      .select('id')
      .eq('edition_id', editionId)
      .eq('voter_id', memberId) // Utiliser voter_id au lieu de member_id
    
    const hasVoted = !voteError && votes && votes.length > 0;
    
    console.log(`🗳️ Membre ${memberId} a voté pour édition ${editionId}: ${hasVoted ? 'OUI' : 'NON'}`);
    
    return {
      hasVoted,
      memberId: memberId
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du vote de l\'utilisateur:', error)
    return { hasVoted: false, memberId: memberId }
  }
}

// Récupérer les éditions avec leur statut pour un utilisateur
export async function getEditionsWithStatus(userEmail: string) {
  const supabase = createClient()
  
  try {
    console.log('🔍 Recherche du membre pour email:', userEmail);
    
    // D'abord vérifier la connexion à la base de données
    const { data: testQuery, error: testError } = await supabase
      .from('members')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Erreur de connexion à la base de données:', testError);
      return []
    }
    
    console.log('✅ Connexion à la base de données OK');
    
    // D'abord récupérer les informations du membre
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, email, nom, prenom')
      .eq('email', userEmail)
      .single()
    
    if (memberError || !member) {
      console.warn('❌ Membre non trouvé pour email:', userEmail, memberError);
      
      // Debugging: lister tous les emails disponibles
      const { data: allMembers } = await supabase
        .from('members')
        .select('email, nom, prenom')
        .limit(10)
      
      console.log('📋 Premiers emails dans la base:', allMembers?.map(m => `${m.email} (${m.prenom} ${m.nom})`));
      
      // Essayer une recherche floue pour voir si l'email existe sous une autre forme
      const emailParts = userEmail.split('@')[0].toLowerCase();
      const { data: fuzzyMembers } = await supabase
        .from('members')
        .select('email, nom, prenom')
        .or(`email.ilike.%${emailParts}%,nom.ilike.%${emailParts}%,prenom.ilike.%${emailParts}%`)
        .limit(5)
      
      console.log('🔍 Recherche floue pour des emails similaires:', fuzzyMembers);
      
      return []
    }

    console.log('✅ Membre trouvé:', member);

    // Récupérer les groupes du membre via la table de liaison
    const { data: memberGroups, error: groupsError } = await supabase
      .from('member_groups')
      .select(`
        group_id,
        groups(id, name)
      `)
      .eq('member_id', member.id)
    
    if (groupsError) {
      console.error('❌ Erreur récupération groupes:', groupsError);
      return []
    }

    console.log('📊 Résultat brut member_groups:', memberGroups);

    // Extraire les IDs des groupes du membre
    const groupIds = memberGroups?.map((mg: any) => mg.group_id) || []
    
    if (groupIds.length === 0) {
      console.warn('⚠️ Aucun groupe trouvé pour le membre:', userEmail);
      
      // Debugging: vérifier si la table member_groups a des données
      const { data: allMemberGroups } = await supabase
        .from('member_groups')
        .select('member_id, group_id')
        .limit(10)
      
      console.log('📊 Toutes les associations member_groups:', allMemberGroups);
      
      // Vérifier si des groupes existent
      const { data: allGroups } = await supabase
        .from('groups')
        .select('id, name')
        .limit(10)
      
      console.log('👥 Tous les groupes disponibles:', allGroups);
      
      return []
    }

    console.log(`👥 Groupes du membre [${member.id}]:`, groupIds);

    // Récupérer les éditions de tous les groupes du membre
    console.log('📊 Tentative de récupération des éditions...');
    
    const { data: editions, error: editionsError } = await supabase
      .from('editions')
      .select('id, title, description, group_id, no_self_vote')
      .in('group_id', groupIds)  // Filtrer par tous les groupes du membre
      .order('id', { ascending: false })
    
    if (editionsError) {
      console.error('❌ Erreur récupération éditions:', editionsError);
      return []
    }

    console.log(`📊 Éditions trouvées pour les groupes [${groupIds.join(', ')}]:`, editions?.length || 0);

    // Si aucune édition trouvée, debug supplémentaire
    if (!editions || editions.length === 0) {
      const { data: allEditions } = await supabase
        .from('editions')
        .select('id, title, description, group_id')
        .limit(10)
      
      console.log('📊 Toutes les éditions dans la base:', allEditions);
      return []
    }

    // Pour chaque édition, vérifier le statut
    const editionsWithStatus = await Promise.all(
      (editions || []).map(async (edition) => {
        const status = await checkEditionStatus(edition.id)
        const userVote = await checkUserVoteStatusByMemberId(edition.id, member.id)
        
        return {
          ...edition,
          ...status,
          userHasVoted: userVote.hasVoted,
          canViewResults: status.isComplete || userVote.hasVoted
        }
      })
    )

    return editionsWithStatus
  } catch (error) {
    console.error('Erreur lors de la récupération des éditions:', error)
    return []
  }
}