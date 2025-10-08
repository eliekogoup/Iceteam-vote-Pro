import React from 'react'
import { FixedSizeList as List } from 'react-window'

type Member = { id: number; name?: string; email?: string; prenom?: string; nom?: string; groups?: any[]; is_admin?: boolean }

export default function MembersVirtualList({ members, rowHeight = 56 }: { members: Member[]; rowHeight?: number }) {
  const Row = ({ index, style }: { index: number; style: any }) => {
    const member = members[index]
    return (
      <div style={{ ...style, display: 'flex', alignItems: 'center', padding: '8px', borderBottom: '1px solid #eee' }}>
        <div style={{ width: '60px' }}>{member.id}</div>
        <div style={{ flex: 1 }}>{member.name || (member.prenom ? `${member.prenom} ${member.nom}` : 'Nom inconnu')}</div>
        <div style={{ width: '220px' }}>{member.email || <em style={{ color: '#999' }}>Pas d'email</em>}</div>
        <div style={{ width: '120px' }}>{member.is_admin ? '✅ Admin' : '👤'}</div>
      </div>
    )
  }

  return (
    <List
      height={500}
      itemCount={members.length}
      itemSize={rowHeight}
      width={'100%'}
    >
      {Row}
    </List>
  )
}
