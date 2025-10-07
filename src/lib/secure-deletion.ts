// Utilitaire pour les suppressions sécurisées
// À utiliser dans toutes les pages admin

import { supabase } from './supabaseClient';

export interface DeletionResult {
  success: boolean;
  message: string;
  affectedRecords?: number;
}

/**
 * Supprime un membre de manière sécurisée via fonction SQL
 */
export async function deleteMemberSafely(memberId: number): Promise<DeletionResult> {
  try {
    const { data, error } = await supabase
      .rpc('delete_member_safely', { member_id_to_delete: memberId });

    if (error) {
      console.error('Erreur suppression membre:', error);
      return {
        success: false,
        message: `Erreur lors de la suppression: ${error.message}`
      };
    }

    return {
      success: true,
      message: data || 'Membre supprimé avec succès'
    };
  } catch (err) {
    console.error('Erreur inattendue:', err);
    return {
      success: false,
      message: 'Erreur inattendue lors de la suppression'
    };
  }
}

/**
 * Supprime une édition de manière sécurisée via fonction SQL
 */
export async function deleteEditionSafely(editionId: number): Promise<DeletionResult> {
  try {
    const { data, error } = await supabase
      .rpc('delete_edition_safely', { edition_id_to_delete: editionId });

    if (error) {
      console.error('Erreur suppression édition:', error);
      return {
        success: false,
        message: `Erreur lors de la suppression: ${error.message}`
      };
    }

    return {
      success: true,
      message: data || 'Édition supprimée avec succès'
    };
  } catch (err) {
    console.error('Erreur inattendue:', err);
    return {
      success: false,
      message: 'Erreur inattendue lors de la suppression'
    };
  }
}

/**
 * Supprime une question de manière sécurisée via fonction SQL
 */
export async function deleteQuestionSafely(questionId: number): Promise<DeletionResult> {
  try {
    const { data, error } = await supabase
      .rpc('delete_question_safely', { question_id_to_delete: questionId });

    if (error) {
      console.error('Erreur suppression question:', error);
      return {
        success: false,
        message: `Erreur lors de la suppression: ${error.message}`
      };
    }

    return {
      success: true,
      message: data || 'Question supprimée avec succès'
    };
  } catch (err) {
    console.error('Erreur inattendue:', err);
    return {
      success: false,
      message: 'Erreur inattendue lors de la suppression'
    };
  }
}

/**
 * Supprime un groupe de manière sécurisée via fonction SQL
 */
export async function deleteGroupSafely(groupId: number): Promise<DeletionResult> {
  try {
    const { data, error } = await supabase
      .rpc('delete_group_safely', { group_id_to_delete: groupId });

    if (error) {
      console.error('Erreur suppression groupe:', error);
      return {
        success: false,
        message: `Erreur lors de la suppression: ${error.message}`
      };
    }

    return {
      success: true,
      message: data || 'Groupe supprimé avec succès'
    };
  } catch (err) {
    console.error('Erreur inattendue:', err);
    return {
      success: false,
      message: 'Erreur inattendue lors de la suppression'
    };
  }
}

/**
 * Utilitaire pour demander confirmation avec message personnalisé
 */
export function confirmDeletion(itemType: string, itemName: string, warnings?: string[]): boolean {
  let message = `Êtes-vous sûr de vouloir supprimer ${itemType} "${itemName}" ?`;
  
  if (warnings && warnings.length > 0) {
    message += '\n\n⚠️ ATTENTION:\n' + warnings.join('\n');
  }
  
  message += '\n\nCette action est irréversible.';
  
  return confirm(message);
}

/**
 * Utilitaire pour afficher le résultat d'une suppression
 */
export function showDeletionResult(result: DeletionResult): void {
  if (result.success) {
    alert(`✅ ${result.message}`);
  } else {
    alert(`❌ ${result.message}`);
  }
}

/**
 * Fonction générique pour gérer une suppression avec confirmation
 */
export async function handleSecureDeletion<T>(
  item: T,
  itemType: string,
  getItemName: (item: T) => string,
  getItemId: (item: T) => number,
  deleteFunction: (id: number) => Promise<DeletionResult>,
  onSuccess?: () => void,
  warnings?: string[]
): Promise<void> {
  const itemName = getItemName(item);
  const itemId = getItemId(item);
  
  if (!confirmDeletion(itemType, itemName, warnings)) {
    return;
  }
  
  try {
    const result = await deleteFunction(itemId);
    showDeletionResult(result);
    
    if (result.success && onSuccess) {
      onSuccess();
    }
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    alert('❌ Erreur inattendue lors de la suppression');
  }
}