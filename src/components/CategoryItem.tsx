import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native'

interface Props {
  name: string
  isActive: boolean
  onPress: () => void
}

const MAIN_YELLOW = '#FF0000'

export const CategoryItem = ({ name, isActive, onPress }: Props) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.button,
        isActive ? styles.activeButton : styles.inactiveButton,
        // Android uchun soya mantiig'i
        isActive && Platform.OS === 'android' ? { elevation: 6 } : null
      ]}
    >
      <Text style={[
        styles.text,
        isActive ? styles.activeText : styles.inactiveText
      ]}>
        {name}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    marginRight: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20, // Zamonaviy UI uchun biroz burchakliroq yumaloqlik
    borderWidth: 0,   // Border o'rniga soya va rang bilan ajratamiz
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  activeButton: {
    backgroundColor: MAIN_YELLOW,
    // iOS uchun premium soya (shadow)
    shadowColor: MAIN_YELLOW,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  inactiveButton: {
    backgroundColor: '#F3F4F6', // Och kulrang fonda nofaol element yaxshi turadi
  },
  text: {
    fontSize: 15,
    letterSpacing: 0.3,
  },
  activeText: {
    color: '#FFFFFF',
    fontWeight: '900', // Sariq fonda oq matn aniq ko'rinishi uchun eng qalin uslub
  },
  inactiveText: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
})