export const customSelectStyles = {
  control: (base) => ({
    ...base,
    minHeight: '42px',
    borderRadius: '0.5rem',
    borderWidth: '2px',
    borderColor: '#e5e7eb',
    '&:hover': { borderColor: '#3b82f6' },
    '&:focus-within': { 
      borderColor: '#3b82f6', 
      boxShadow: '0 0 0 1px #3b82f6',
      outline: 'none'
    }
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#dbeafe' : 'white',
    color: state.isSelected ? 'white' : '#111827',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: '#3b82f6'
    }
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '0.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    zIndex: 9999
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999
  })
}

export const pinkSelectStyles = {
  control: (base) => ({
    ...base,
    minHeight: '42px',
    borderRadius: '0.5rem',
    borderWidth: '2px',
    borderColor: '#e5e7eb',
    '&:hover': { borderColor: '#ec4899' },
    '&:focus-within': { 
      borderColor: '#ec4899', 
      boxShadow: '0 0 0 1px #ec4899',
      outline: 'none'
    }
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#ec4899' : state.isFocused ? '#fce7f3' : 'white',
    color: state.isSelected ? 'white' : '#111827',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: '#ec4899'
    }
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '0.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    zIndex: 9999
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999
  })
}
