import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native'

interface Props {
  name: string
  isActive: boolean
  onPress: () => void
}

const PRIMARY_RED = '#E63946'

export const CategoryItem = ({ name, isActive, onPress }: Props) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.button,
        isActive ? styles.activeButton : styles.inactiveButton,
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  activeButton: {
    backgroundColor: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  inactiveButton: {
    backgroundColor: '#FFFFFF', 
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  text: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  activeText: {
    color: '#FFFFFF',
    fontWeight: '800', 
  },
  inactiveText: {
    color: '#6B7280',
    fontWeight: '600',
  },
})