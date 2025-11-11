import React from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
} from 'react-native';

export function CategoryPickerModal({ visible, categories, onClose, onSelect, showAllOption = false, styles }) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Escolha uma Categoria</Text>
          <FlatList
            data={categories}
            style={styles.categoryList}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.categoryPickerItem} onPress={() => onSelect(item)}>
                <Text style={styles.categoryLabel}>{item.name}</Text>
              </TouchableOpacity>
            )}
            ListHeaderComponent={
              <>
                {showAllOption && (
                  <TouchableOpacity style={styles.categoryPickerItem} onPress={() => onSelect(null)}>
                    <Text style={[styles.categoryLabel, {fontStyle: 'italic'}]}>Todas as categorias</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.categoryPickerItem} onPress={() => onSelect(null)}>
                  <Text style={[styles.categoryLabel, {fontStyle: 'italic'}]}>Sem categoria</Text>
                </TouchableOpacity>
              </>
            }
          />
          <TouchableOpacity style={[styles.proButtonSecondary, {flex: 0}]} onPress={onClose}>
            <Text style={styles.proButtonTextSecondary}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}