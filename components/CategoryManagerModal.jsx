import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { addDoc, collection, doc, deleteDoc } from 'firebase/firestore';

export function CategoryManagerModal({ visible, user, db, appId, categories, onClose, styles }) {
  const [name, setName] = useState('');
  
  const handleAddCategory = async () => {
    if (!name) return;
    const categoriesCollectionPath = `artifacts/${appId}/users/${user.uid}/categories`;
    try {
      await addDoc(collection(db, categoriesCollectionPath), {
        name: name,
        icon: 'tag', // Ícone e cor (simplificado)
        color: '#64748B' 
      });
      setName('');
    } catch (e) {
      console.error("Erro ao adicionar categoria:", e);
      Alert.alert("Erro", "Não foi possível salvar a categoria.");
    }
  };

  const handleDeleteCategory = (categoryId) => {
    Alert.alert(
      "Excluir Categoria",
      "Tem certeza? Isso não removerá a categoria de dívidas antigas.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          style: "destructive", 
          onPress: async () => {
            const categoryRef = doc(db, `artifacts/${appId}/users/${user.uid}/categories`, categoryId);
            try {
              await deleteDoc(categoryRef);
            } catch (e) {
              console.error("Erro ao excluir categoria:", e);
              Alert.alert("Erro", "Não foi possível excluir.");
            }
          } 
        }
      ]
    );
  };
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.modalBackdrop}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Gerenciar Categorias</Text>
          
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.proInput, {flex: 1}]}
              placeholder="Nome da nova categoria"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity style={[styles.proButtonPrimary, {marginLeft: 10, marginBottom: 0, flex: 0}]} onPress={handleAddCategory}>
              <Text style={styles.proButtonTextPrimary}>Salvar</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={categories}
            style={styles.categoryList}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.categoryItem}>
                <Text style={styles.categoryLabel}>{item.name}</Text>
                <TouchableOpacity onPress={() => handleDeleteCategory(item.id)}>
                  <Text style={{color: 'red'}}>Excluir</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyListText}>Nenhuma categoria cadastrada.</Text>}
          />
          
          <TouchableOpacity style={[styles.proButtonSecondary, {flex: 0}]} onPress={onClose}>
            <Text style={styles.proButtonTextSecondary}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}