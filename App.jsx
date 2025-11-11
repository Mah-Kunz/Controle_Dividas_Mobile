import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Importações do Firebase (SDK v9)
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  // O Login Google no nativo é complexo e requer 'expo-google-app-auth' ou '@react-native-google-signin/google-signin'
  // Vamos focar no Email/Senha por enquanto.
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  writeBatch,
  Timestamp,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
  getDocs,
  addDoc,
} from 'firebase/firestore';

// --- Configuração do Firebase ---
// COLE A SUA CONFIGURAÇÃO DO FIREBASE AQUI
const firebaseConfig = {
  apiKey: "AIzaSyD1IQ6u_VfG4rbnq0AFaT1jvLapEbntgUI",
  authDomain: "controle-dividas-aeca5.firebaseapp.com",
  projectId: "controle-dividas-aeca5",
  storageBucket: "controle-dividas-aeca5.firebasestorage.app",
  messagingSenderId: "613010871623",
  appId: "1:613010871623:web:37019d81909dd856816862"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// O app ID (para o caminho do Firestore)
// ATENÇÃO: Use o mesmo ID da web-app se for diferente
const appId = 'default-app-id'; 

// --- Componente: Tela de Login ---
function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setError('Email ou senha inválidos.');
      console.error(e);
    }
  };

  const handleRegister = async () => {
    setError('');
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        setError('Este email já está em uso.');
      } else {
        setError('Erro ao criar conta.');
      }
      console.error(e);
    }
  };

  return (
    // CORREÇÃO: SafeAreaView é agora o wrapper principal deste ecrã
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.loginContainer}
      >
        <Text style={styles.title}>Minhas Dívidas</Text>
        <Text style={styles.subtitle}>Acesse sua conta para continuar</Text>
        
        <TextInput
          style={styles.proInput}
          placeholder="seu@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#9ca3af"
        />
        <TextInput
          style={styles.proInput}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#9ca3af"
        />
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        {/* CORREÇÃO: Os botões agora têm o tamanho correto (sem flex: 1) */}
        <TouchableOpacity style={styles.proButtonPrimary} onPress={handleLogin}>
          <Text style={styles.proButtonTextPrimary}>Entrar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.proButtonSecondary} onPress={handleRegister}>
          <Text style={styles.proButtonTextSecondary}>Criar Conta</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Componente: Tela Principal do App ---
function AppScreen({ user }) {
  // Estado da Lista
  const [parcels, setParcels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // NOVO: Estado dos Filtros
  const [includePaid, setIncludePaid] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null); // null = Todas

  // Estado dos Modais
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [isEditGroupModalVisible, setEditGroupModalVisible] = useState(false);
  const [isCategoryPickerVisible, setCategoryPickerVisible] = useState(false);

  // Item selecionado para Modais
  const [selectedParcel, setSelectedParcel] = useState(null);

  // Helpers
  const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
  
  const monthName = useMemo(() => {
    return capitalize(currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }));
  }, [currentMonth]);
  
  const totalThisMonth = useMemo(() => {
    // Calcula o total APENAS das não pagas, independente do filtro
    return parcels
      .filter(p => !p.paid)
      .reduce((acc, parcel) => acc + parcel.value, 0);
  }, [parcels]);

  // --- OUVINTES DO FIREBASE ---

  // Ouvinte de Categorias
  useEffect(() => {
    if (!user) return;
    const categoriesCollectionPath = `artifacts/${appId}/users/${user.uid}/categories`;
    const q = query(collection(db, categoriesCollectionPath));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(cats);
    }, (error) => {
      console.error("Erro ao buscar categorias:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Ouvinte de Parcelas (por mês)
  useEffect(() => {
    if (!user) return;

    // Calcula início e fim do mês
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);
    
    const startTimestamp = Timestamp.fromDate(start);
    const endTimestamp = Timestamp.fromDate(end);

    const parcelsCollectionPath = `artifacts/${appId}/users/${user.uid}/parcels`;
    let queryConstraints = [
      where("paymentDate", ">=", startTimestamp),
      where("paymentDate", "<=", endTimestamp)
    ];

    // Adiciona filtros
    if (!includePaid) {
      queryConstraints.push(where("paid", "==", false));
    }
    if (selectedCategoryFilter) {
      queryConstraints.push(where("category.id", "==", selectedCategoryFilter.id));
    }
    
    const q = query(collection(db, parcelsCollectionPath), ...queryConstraints);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const parcelas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      parcelas.sort((a, b) => a.paymentDate.seconds - b.paymentDate.seconds);
      setParcels(parcelas);
    }, (error) => {
      console.error("Erro ao buscar parcelas:", error);
      Alert.alert("Erro de Índice", "Esta consulta precisa de um índice no Firebase. Verifique o console do seu navegador web (do app antigo) para copiar o link de criação do índice.");
    });

    return () => unsubscribe();
  }, [user, currentMonth, includePaid, selectedCategoryFilter]); // Re-busca com qualquer filtro

  // --- Handlers de Ação ---

  const handleLogout = () => {
    signOut(auth);
  };

  const changeMonth = (amount) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
  };
  
  const handlePay = async (parcelId) => {
    const parcelRef = doc(db, `artifacts/${appId}/users/${user.uid}/parcels`, parcelId);
    try {
      await updateDoc(parcelRef, { paid: true });
    } catch (e) {
      console.error("Erro ao pagar:", e);
      Alert.alert("Erro", "Não foi possível marcar como pago.");
    }
  };
  
  // --- Funções de Modal ---
  const openDeleteModal = (item) => {
    setSelectedParcel(item);
    setDeleteModalVisible(true);
  };
  
  const handleDeleteOne = async () => {
    if (!selectedParcel) return;
    const parcelRef = doc(db, `artifacts/${appId}/users/${user.uid}/parcels`, selectedParcel.id);
    try {
      await deleteDoc(parcelRef);
      setDeleteModalVisible(false);
      setSelectedParcel(null);
    } catch (e) {
      console.error("Erro ao excluir:", e);
      Alert.alert("Erro", "Não foi possível excluir a parcela.");
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedParcel) return;
    const groupId = selectedParcel.debtGroupId;
    
    const q = query(
      collection(db, `artifacts/${appId}/users/${user.uid}/parcels`),
      where("debtGroupId", "==", groupId)
    );
    
    try {
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      
      setDeleteModalVisible(false);
      setSelectedParcel(null);
    } catch (e) {
      console.error("Erro ao excluir grupo:", e);
      Alert.alert("Erro", "Não foi possível excluir a dívida inteira.");
    }
  };

  // --- Componente: Item da Parcela ---
  const ParcelItem = ({ item }) => {
    const dataVencimento = item.paymentDate.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const category = item.category;
    const categoryColor = category ? category.color : '#cbd5e1';
    
    return (
      <View style={[styles.parcelItem, { borderLeftColor: categoryColor, opacity: item.paid ? 0.5 : 1 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.parcelDescription, item.paid && styles.parcelDescriptionPaid]}>{item.debtDescription}</Text>
          <Text style={styles.parcelDetails}>
            Venc: {dataVencimento} | Parcela {item.installmentNumber}/{item.totalInstallments}
          </Text>
        </View>
        <View style={styles.parcelActions}>
          <Text style={[styles.parcelValue, item.paid && styles.parcelValuePaid]}>
            R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
          {!item.paid && (
            <TouchableOpacity style={styles.proButtonPay} onPress={() => handlePay(item.id)}>
              <Text style={styles.proButtonTextPrimary}>Pagar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.proButtonGhost} onPress={() => Alert.alert("Editar Grupo", "WIP")}>
             <Text style={styles.proButtonTextSecondary}>L</Text>{/* Layers */}
          </TouchableOpacity>
          <TouchableOpacity style={styles.proButtonGhost} onPress={() => Alert.alert("Editar", "WIP")}>
             <Text style={styles.proButtonTextSecondary}>E</Text>{/* Edit */}
          </TouchableOpacity>
          <TouchableOpacity style={styles.proButtonGhost} onPress={() => openDeleteModal(item)}>
             <Text style={styles.proButtonTextSecondary}>X</Text>{/* Excluir */}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    // CORREÇÃO: SafeAreaView é agora o wrapper principal deste ecrã
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Dívidas</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.headerButton}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Seletor de Mês */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <Text style={styles.monthButton}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthName}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)}>
          <Text style={styles.monthButton}>{'>'}</Text>
        </TouchableOpacity>
      </View>
      
      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity style={styles.proInputSmall} onPress={() => setCategoryPickerVisible(true)}>
            <Text style={{color: selectedCategoryFilter ? '#000' : '#9ca3af'}}>
              {selectedCategoryFilter ? selectedCategoryFilter.name : 'Todas as categorias'}
            </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.radioOption} onPress={() => setIncludePaid(!includePaid)}>
            <View style={[styles.radioOuter, includePaid && styles.radioOuterActive]}>
              {includePaid && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioLabel}>Incluir pagas</Text>
        </TouchableOpacity>
      </View>

      {/* Total do Mês */}
      <View style={styles.monthTotalContainer}>
        <Text style={styles.monthTotalLabel}>Total em Aberto:</Text>
        <Text style={styles.monthTotalValue}>
          R$ {totalThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </Text>
      </View>

      {/* Lista de Parcelas */}
      <FlatList
        data={parcels}
        renderItem={ParcelItem}
        keyExtractor={item => item.id}
        style={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Text style={styles.emptyListText}>Nenhuma parcela para os filtros selecionados.</Text>
          </View>
        }
      />
      
      {/* Botões de Ação */}
      <View style={styles.actionButtonsContainer}>
        {/* CORREÇÃO: Adicionado style={{flex: 1}} para os botões se dividirem */}
        <TouchableOpacity style={[styles.proButtonSecondary, {flex: 1}]} onPress={() => setCategoryModalVisible(true)}>
          <Text style={styles.proButtonTextSecondary}>Categorias</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.proButtonPrimary, {flex: 1}]} onPress={() => setAddModalVisible(true)}>
          <Text style={styles.proButtonTextPrimary}>+ Nova Dívida</Text>
        </TouchableOpacity>
      </View>

      {/* --- MODAIS --- */}

      {/* Modal: Adicionar Dívida */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAddModalVisible}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <AddDebtModal 
          user={user}
          categories={categories}
          onClose={() => setAddModalVisible(false)}
        />
      </Modal>

      {/* Modal: Gerenciar Categorias */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCategoryModalVisible}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <CategoryManagerModal 
          user={user}
          categories={categories}
          onClose={() => setCategoryModalVisible(false)}
        />
      </Modal>

      {/* Modal: Confirmação de Exclusão */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isDeleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Confirmar Exclusão</Text>
            <Text style={styles.modalText}>
              O que você deseja excluir da dívida "{selectedParcel?.debtDescription}"?
            </Text>
            <TouchableOpacity style={styles.proButtonDanger} onPress={handleDeleteOne}>
              <Text style={styles.proButtonTextPrimary}>Excluir Apenas esta Parcela</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.proButtonDanger, {backgroundColor: '#991b1b'}]} onPress={handleDeleteGroup}>
              <Text style={styles.proButtonTextPrimary}>Excluir Dívida Inteira</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.proButtonSecondary} onPress={() => setDeleteModalVisible(false)}>
              <Text style={styles.proButtonTextSecondary}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Modal: Picker de Categoria (para o Filtro) */}
      <CategoryPickerModal
        visible={isCategoryPickerVisible}
        categories={categories}
        onClose={() => setCategoryPickerVisible(false)}
        onSelect={(cat) => {
          setSelectedCategoryFilter(cat);
          setCategoryPickerVisible(false);
        }}
        showAllOption={true}
      />

    </SafeAreaView>
  );
}

// --- Componente: Modal de Adicionar Dívida ---
function AddDebtModal({ user, categories, onClose }) {
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
    } catch (e) {
      console.error("Erro ao salvar dívida:", e);
      Alert.alert("Erro", "Não foi possível salvar a dívida.");
    }
  };

  return (
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

      {/* Modal: Picker de Categoria */}
      <CategoryPickerModal
        visible={isPickerVisible}
        categories={categories}
        onClose={() => setPickerVisible(false)}
        onSelect={(cat) => {
          setSelectedCategory(cat);
          setPickerVisible(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}

// --- Componente: Modal Gerenciador de Categorias ---
function CategoryManagerModal({ user, categories, onClose }) {
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
  );
}

// --- Componente: Picker de Categoria Customizado ---
function CategoryPickerModal({ visible, categories, onClose, onSelect, showAllOption = false }) {
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


// --- Componente Principal ---
// CORREÇÃO: Removida a SafeAreaView daqui
export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Ouve as mudanças de autenticação
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe(); // Limpa o ouvinte
  }, []);

  // Renderiza o ecrã apropriado (cada um com a sua própria SafeAreaView)
  return user ? <AppScreen user={user} /> : <LoginScreen />;
}

// --- Folha de Estilos (StyleSheet) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc', // bg-slate-50
  },
  // container: { // Este estilo não é mais necessário no AppScreen
  //   flex: 1,
  // },
  // --- Estilos de Login ---
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8fafc', // bg-slate-50
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a', // text-slate-900
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b', // text-slate-600
    textAlign: 'center',
    marginBottom: 24,
  },
  errorText: {
    color: '#dc2626', // text-red-600
    textAlign: 'center',
    marginBottom: 12,
  },
  // --- Estilos "Pro" (Replicando o CSS) ---
  proInput: {
    height: 44,
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1', // border-slate-300
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 16,
  },
  proInputSmall: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1', // border-slate-300
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    justifyContent: 'center',
    flex: 1,
  },
  proButton: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  proButtonPrimary: {
    backgroundColor: '#0f172a', // bg-slate-900
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
    // CORREÇÃO: 'flex: 1' removido daqui
  },
  proButtonTextPrimary: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
  },
  proButtonSecondary: {
    backgroundColor: '#fff', // bg-white
    borderWidth: 1,
    borderColor: '#cbd5e1', // border-slate-300
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
    // CORREÇÃO: 'flex: 1' removido daqui
  },
  proButtonTextSecondary: {
    color: '#0f172a', // text-slate-900
    fontWeight: '500',
    fontSize: 16,
  },
  proButtonPay: {
    backgroundColor: '#16a34a', // bg-green-600
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 4,
  },
  proButtonGhost: {
    padding: 6,
  },
  proButtonDanger: {
     backgroundColor: '#dc2626', // bg-red-600
     height: 44,
     justifyContent: 'center',
     alignItems: 'center',
     borderRadius: 8,
     marginBottom: 12,
  },
  proButtonDangerOutline: {
     backgroundColor: '#f8fafc', // bg-red-600
     height: 44,
     justifyContent: 'center',
     alignItems: 'center',
     borderRadius: 8,
     marginBottom: 12,
     borderColor: '#dc2626',
     borderWidth: 1,
  },
  // --- Estilos do App ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0', // border-slate-200
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerButton: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '500',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  monthButton: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4f46e5', // indigo-600
    paddingHorizontal: 10,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  monthTotalContainer: {
    backgroundColor: '#eef2ff', // indigo-50
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c7d2fe', // indigo-200
  },
  monthTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3730a3', // indigo-800
  },
  monthTotalValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4f46e5', // indigo-600
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  emptyList: {
    padding: 20,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 16,
    color: '#64748b',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 10,
  },
  // --- Estilos do Item da Parcela ---
  parcelItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 5,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  parcelDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b', // slate-800
  },
  parcelDescriptionPaid: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  parcelDetails: {
    fontSize: 14,
    color: '#64748b',
  },
  parcelActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  parcelValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
    marginRight: 8,
  },
  parcelValuePaid: {
    color: '#16a34a', // green-600
  },
  // --- Estilos de Modal ---
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    gap: 10, // Adiciona espaço entre os botões
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 20,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioOuterActive: {
    borderColor: '#4f46e5',
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#4f46e5',
  },
  radioLabel: {
    fontSize: 16,
    color: '#374151',
  },
  categoryList: {
    maxHeight: 200,
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  categoryPickerItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 16,
  },
});