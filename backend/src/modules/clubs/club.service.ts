import { createHash, randomBytes } from 'node:crypto'
import { db } from '../../config/database.js'
import { AppError } from '../../shared/http.js'

const hash = (value: string) => createHash('sha256').update(value).digest('hex')
const slug = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 42) || 'club'

export async function listClubs(userId: string) {
  return db`
    select c.id, c.name, c.slug, c.visibility, c.owner_id, count(cm.user_id)::int as member_count,
      bool_or(cm.user_id = ${userId}) as joined
    from clubs c left join club_members cm on cm.club_id = c.id
    where c.visibility = 'public' or exists (
      select 1 from club_members mine where mine.club_id = c.id and mine.user_id = ${userId}
    )
    group by c.id order by joined desc, c.created_at desc
  `
}

export async function createClub(userId: string, input: { name: string; visibility: 'public' | 'private' }) {
  const inviteCode = randomBytes(4).toString('hex').toUpperCase()
  const clubSlug = `${slug(input.name)}-${randomBytes(2).toString('hex')}`
  const club = await db.begin(async (transaction) => {
    const [created] = await transaction`
      insert into clubs (name, slug, visibility, owner_id, invite_code_hash)
      values (${input.name}, ${clubSlug}, ${input.visibility}, ${userId}, ${hash(inviteCode)}) returning *
    `
    await transaction`insert into club_members (club_id, user_id, role) values (${created.id}, ${userId}, 'admin')`
    return created
  })
  return { ...club, inviteCode: input.visibility === 'private' ? inviteCode : null }
}

export async function joinPrivateClub(userId: string, inviteCode: string) {
  const [club] = await db`
    select id, name, slug, visibility, owner_id from clubs
    where visibility = 'private' and invite_code_hash = ${hash(inviteCode.toUpperCase())}
  `
  if (!club) throw new AppError('Invite code is incorrect', 404)
  await db`insert into club_members (club_id, user_id) values (${club.id}, ${userId}) on conflict do nothing`
  return club
}

export async function joinClub(userId: string, clubId: string, inviteCode?: string) {
  const [club] = await db`select * from clubs where id = ${clubId}`
  if (!club) throw new AppError('Club not found', 404)
  if (club.visibility === 'private' && hash(inviteCode?.toUpperCase() ?? '') !== club.invite_code_hash) throw new AppError('Invite code is incorrect', 403)
  await db`insert into club_members (club_id, user_id) values (${club.id}, ${userId}) on conflict do nothing`
}

export async function regenerateInviteCode(userId: string, clubId: string) {
  const inviteCode = randomBytes(4).toString('hex').toUpperCase()
  const [club] = await db`
    update clubs set invite_code_hash = ${hash(inviteCode)}
    where id = ${clubId} and owner_id = ${userId} and visibility = 'private' returning id
  `
  if (!club) throw new AppError('Only the private club owner can do that', 403)
  return { inviteCode }
}

export async function getClub(userId: string, clubId: string) {
  const [club] = await db`
    select c.*, exists(select 1 from club_members where club_id = c.id and user_id = ${userId}) as joined
    from clubs c where c.id = ${clubId}
  `
  if (!club || (club.visibility === 'private' && !club.joined)) throw new AppError('Club not found', 404)
  const [members, tournaments] = await Promise.all([
    db`select p.id, p.name, p.username, cm.role from club_members cm join profiles p on p.id = cm.user_id where cm.club_id = ${club.id} order by cm.role, p.username`,
    db`select * from tournaments where club_id = ${club.id} order by created_at desc`,
  ])
  return { ...club, members, tournaments }
}
