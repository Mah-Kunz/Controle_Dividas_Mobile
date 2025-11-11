import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Timestamp, collection, doc, writeBatch } from 'firebase/firestore';
import { CategoryPickerModal } from './CategoryPickerModal'; // Importa o picker

export function AddDebtModal({ visible, user, db, appId, categories, onClose, styles }) {
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [installments, setInstallments] = useState('');
  const [calcMode, setCalcMode] = useState('total'); // 'total' ou 'installment'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isPickerVisible, setPickerVisible] = useState(false);
  
  // Data (simplificado para hoje)
  const [startDate] = useState(new Date()); 

  const handleSave = async () => {
    const enteredValue = parseFloat(value);
    const numInstallments = parseInt(installments);

    if (!description || !enteredValue || !numInstallments) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }
    
    let totalValue;
    let installmentValue;

    if (calcMode === 'installment') {
        installmentValue = enteredValue;
        totalValue = installmentValue * numInstallments;
    } else {
        totalValue = enteredValue;
        installmentValue = parseFloat((totalValue / numInstallments).toFixed(2));
    }

    const debtGroupId = crypto.randomUUID();
    const batch = writeBatch(db);
    const parcelsCollectionPath = `artifacts/${appId}/users/${user.uid}/parcels`;
    const parcelsCollection = collection(db, parcelsCollectionPath);
    let cumulativeValue = 0;

    for (let i = 0; i < numInstallments; i++) {
        const paymentDate = new Date(startDate);
        paymentDate.setMonth(startDate.getMonth() + i);

        let currentInstallmentValue = installmentValue;
        if (calcMode === 'total') {
            cumulativeValue += installmentValue;
            if (i === numInstallments - 1) { // Ajuste da última parcela
                const difference = totalValue - cumulativeValue;
                currentInstallmentValue = parseFloat((installmentValue + difference).toFixed(2));
            }
        }


        const parcelData = {
            debtDescription: description,
            debtGroupId: debtGroupId,
            installmentNumber: i + 1,
            totalInstallments: numInstallments,
            value: currentInstallmentValue,
            paymentDate: Timestamp.fromDate(paymentDate),
            paid: false,
            category: selectedCategory // Salva o objeto da categoria
        };
        const newParcelRef = doc(parcelsCollection);
        batch.set(newParcelRef, parcelData);
    }

    try {
      await batch.commit();
      Alert.alert("Sucesso", `${numInstallments} parcelas criadas.`);
      onClose();
      // Limpar formulário
      setDescription('');
      setValue('');
      setInstallments('');
      setSelectedCategory(null);
      setCalcMode('total');
    } catch (e) {
      console.error("Erro ao salvar dívida:", e);
      Alert.alert("Erro", "Não foi possível salvar a dívida.");
    }
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
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Adicionar Nova Dívida</Text>
            
            <TextInput
              style={styles.proInput}
              placeholder="Descrição (Ex: TV da Sala)"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor="#9ca3af"
            />
            
            {/* Seletor de Categoria Customizado */}
            <TouchableOpacity style={styles.proInput} onPress={() => setPickerVisible(true)}>
              <Text style={{color: selectedCategory ? '#000' : '#9ca3af'}}>
                {selectedCategory ? selectedCategory.name : 'Escolha uma categoria...'}
              </Text>
            </TouchableOpacity>

            {/* Tipo de Cálculo */}
            <View style={styles.radioContainer}>
              <TouchableOpacity style={styles.radioOption} onPress={() => setCalcMode('total')}>
                <View style={[styles.radioOuter, calcMode === 'total' && styles.radioOuterActive]}>
                  {calcMode === 'total' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>Valor Total</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.radioOption} onPress={() => setCalcMode('installment')}>
                <View style={[styles.radioOuter, calcMode === 'installment' && styles.radioOuterActive]}>
                  {calcMode === 'installment' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>Valor da Parcela</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.proInput, {flex: 1}]}
                placeholder={calcMode === 'total' ? 'Valor Total' : 'Valor da Parcela'}
                value={value}
                onChangeText={setValue}
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
              />
              <TextInput
                style={[styles.proInput, {flex: 1, marginLeft: 10}]}
                placeholder="Nº Parcelas"
                value={installments}
                onChangeText={setInstallments}
                keyboardType="number-pad"
                placeholderTextColor="#9ca3af"
              />
            </View>
            
            <TouchableOpacity style={[styles.proButtonPrimary, {flex: 0}]} onPress={handleSave}>
              <Text style={styles.proButtonTextPrimary}>Salvar Dívida</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.proButtonSecondary, {flex: 0}]} onPress={onClose}>
              <Text style={styles.proButtonTextSecondary}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal: Picker de Categoria */}
      <CategoryPickerModal
        visible={isPickerVisible}
        categories={categories}
        onClose={() => setPickerVisible(false)}
        onSelect={(cat) => {
          setSelectedCategory(cat);
          setPickerVisible(false);
        }}
        styles={styles}
      />
    </Modal>
  );
}