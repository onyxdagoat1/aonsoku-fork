export interface Era {
  id: string
  label: string
  color: string
}

export const ERAS: Era[] = [
  { id: 'before-tcd', label: 'Before TCD', color: '#a61c00' },
  { id: 'tcd', label: 'The College Dropout', color: '#9f3621' },
  { id: 'lr', label: 'Late Registration', color: '#704b12' },
  { id: 'graduation', label: 'Graduation', color: '#8e378c' },
  { id: 'eight08s', label: '808s & Heartbreak', color: '#f20001' },
  { id: 'gaj', label: 'Good Ass Job', color: '#40206f' },
  { id: 'mbdtf', label: 'MBDTF', color: '#b11d33' },
  { id: 'wtt', label: 'Watch the Throne', color: '#b28e5d' },
  { id: 'cruel-summer', label: 'Cruel Summer', color: '#858585' },
  { id: 'tgfd', label: 'TGFD', color: '#3d85c6' },
  { id: 'yeezus', label: 'Yeezus', color: '#ff0000' },
  { id: 'yeezus2', label: 'Yeezus II', color: '#7a2b22' },
  { id: 'shmg', label: 'SHMG', color: '#6b5f5a' },
  { id: 'swish', label: 'Swish', color: '#8b4447' },
  { id: 'tlop', label: 'The Life of Pablo', color: '#ff6011' },
  { id: 'cruel-winter', label: 'Cruel Winter', color: '#c6c6c6' },
  { id: 'turbografx16', label: 'TurboGrafx16', color: '#302b4a' },
  { id: 'le', label: 'Love Everyone', color: '#424245' },
  { id: 'ye', label: 'ye', color: '#1d864b' },
  { id: 'ksg', label: 'Kids See Ghosts', color: '#535237' },
  { id: 'gaj-2018', label: 'Good Ass Job (2018)', color: '#bd7bc2' },
  { id: 'yandhi', label: 'Yandhi', color: '#a64d79' },
  { id: 'jik', label: 'Jesus Is King', color: '#003beb' },
  { id: 'gods-country', label: "God's Country", color: '#1e1e6c' },
  { id: 'donda-v1', label: 'Donda V1', color: '#e84125' },
  { id: 'donda-v2', label: 'Donda V2', color: '#398a96' },
  { id: 'donda', label: 'Donda', color: '#020305' },
  { id: 'donda2', label: 'Donda 2', color: '#302022' },
  { id: 'war', label: 'War', color: '#6a6a6a' },
  { id: 'yebu', label: 'Yebu', color: '#8c464c' },
  { id: 'bbpb', label: 'Bad Bitch Play Book', color: '#554e3d' },
  { id: 'vultures', label: 'Vultures', color: '#715b47' },
  { id: 'vultures2', label: 'Vultures 2', color: '#d79d12' },
  { id: 'vultures3', label: 'Vultures 3', color: '#8b6f47' },
  { id: 'wolves', label: 'Wolves', color: '#2d3436' },
  { id: 'bully', label: 'Bully', color: '#434343' },
  { id: 'other', label: 'Other', color: '#808080' },
]

export const getEraColor = (eraId?: string) => {
  const era = ERAS.find((e) => e.id === eraId)
  return era ? era.color : '#808080'
}

export const getEraLabel = (eraId?: string) => {
  const era = ERAS.find((e) => e.id === eraId)
  return era ? era.label : 'Unknown Era'
}
