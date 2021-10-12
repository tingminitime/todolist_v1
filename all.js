// ----- 變數 -----
const taskInput = document.querySelector('.input__taskInput')
const addBtn = document.querySelector('.input__add')
const taskList = document.querySelector('.taskList')

const statusFilter = document.querySelector('.statusFilter')
const filters = document.querySelectorAll('.filter__changeStatus')
const filterAll = document.querySelector('.filter__changeStatus-all')
const filterSelectBlock = document.querySelector('.filter__selectBlock')

const filterAllCount = document.querySelector('.filter__allTaskCount')
const filterUncompletedCount = document.querySelector('.filter__uncompletedTaskCount')
const filterCompletedCount = document.querySelector('.filter__completedTaskCount')

let data = [] // 全部資料
let completedTaskData = [] // 已完成資料
let uncompletedTaskData = [] // 未完成資料
let editMode = false // 是否在編輯模式
let editBlock = null // editBlock 選取暫存器
let prevEditBlock = null // 上一個 editBlock 暫存器
let editInput = null // editInput 選取暫存器
let currentTaskTextId = null // 待辦事項文字 id 暫存器
let checkInput = null // checkInput 選取暫存器
let filterStatus = 'all' // 篩選狀態 all / uncompleted / completed

// ----- HTML載入完畢預設執行 -----
window.onload = function () {
  // 預設待辦事項 focus
  taskInput.focus()
}

// ----- filterSelectBlock 初始化 -----
filterSelectBlockHandler(filterAll)

// ----- 篩選文字顏色初始化 -----
if (filterStatus === 'all') filterAll.classList.add('active')

// ----- 產生ID -----
function generateId() {
  let nowTime = Date.now()
  let timestamp = Math.floor(nowTime / 100)
  return timestamp
}

// ----- 渲染(初始化)待辦事項 -----
function render(data) {
  let renderData = ''
  data.forEach(item => {
    let newContent = `
      <li class="taskList__item">
        <div class="taskList__itemReveal">
          <label class="taskList__label">
            <input
              class="taskList__checkbox"
              type="checkbox"
              data-checkInputId="${item['id']}"
              data-id="${item['id']}"
              ${item['isCompleted'] ? "checked" : ""}
            >
            <span class="taskList__text ${item['isCompleted'] ? 'taskChecked' : ''}" data-taskTextId="${item['id']}">${item['content']}</span>
          </label>
          <button
            class="taskList__editBtn"
            data-id="${item['id']}"
          >編輯</button>
          <button class="taskList__deleteBtn" data-id="${item['id']}">刪除</button>
        </div>
        <div class="taskList__itemEdit" data-editId="${item['id']}">
          <input
            type="text"
            class="taskList__editInput"
            data-editInputId="${item['id']}"
            data-id="${item['id']}"
          >
          <button class="taskList__confirmBtn" data-id="${item['id']}">確定</button>
          <button class="taskList__cancelBtn" data-id="${item['id']}">取消</button>
        </div>
      </li>
    `
    renderData += newContent
  })
  taskList.innerHTML = renderData
}

// ----- 新增待辦事項 -----
function addTask(e) {
  // 若無輸入任何東西按新增 => 警告視窗並 focus
  if (taskInput.value.trim() === '') {
    alert('請輸入待辦事項')
    taskInput.focus()
    return
  }
  // 將要新增的 Task 包裝成物件
  let taskObj = {
    content: taskInput.value,
    id: generateId(),
    isCompleted: false,
  }
  // data 新增 Task 物件
  data.push(taskObj)
  // 更新待完成、未完成的 data 資料
  updateUncompletedTaskData()
  updateCompletedTaskData()
  // 渲染
  rerenderHandler()
  // 改變 filter 上的 task count
  changeTaskCount()
  // taskInput 清空並 focus
  taskInput.value = ''
  taskInput.focus()
}

// ----- 編輯待辦事項 -----
function editTaskHandler(e) {
  // 區域變數
  let targetId = e.target.dataset.id
  let targetClass = e.target.className
  // 選取到當下點擊的 editBlock
  editBlock = document.querySelector(`div[data-editId="${e.target.dataset.id}"]`)
  // 如果 editBlock 是 null，不執行編輯功能，避免 prevEditBlock 因為點擊其他地方被誤存
  if (editBlock === null) return
  // 點擊編輯按鈕 => 顯示/隱藏 編輯區塊
  editBtnHandler(targetClass, editBlock)
  // 點擊取消按鈕 => 隱藏 編輯區塊
  cancelEditBtnHandler(targetClass, editBlock)
  // 判斷選取到的 editBlock 有無 active 這個 class，editMode 為 true / false
  if (editBlock.classList.contains('active')) editMode = true
  else editMode = false
  // 將當前的 Task 文字帶入編輯的 input 並全選
  editInputAutoEmbed(e, targetId)
  // 確定編輯
  confirmEditBtnHandler(e, targetId, editBlock)
  // 使用 enter 按鍵確定編輯
  editEnterHandler()
}

// 點擊編輯按鈕 => 顯示/隱藏 編輯區塊
function editBtnHandler(targetClass, editBlock) {
  if (targetClass === 'taskList__editBtn') {
    editBlock.classList.toggle('active')
    // 點擊編輯後 => 隱藏 上一個編輯區塊
    if (prevEditBlock !== null && prevEditBlock !== editBlock) {
      prevEditBlock.classList.remove('active')
    }
    // 將當前的 編輯區塊儲存成 prevEditBlock
    prevEditBlock = editBlock
  }
}

// 點擊取消按鈕 => 隱藏 編輯區塊
function cancelEditBtnHandler(targetClass, editBlock) {
  if (targetClass === 'taskList__cancelBtn') {
    editBlock.classList.toggle('active')
    editMode = false
  }
}

// 將當前的 Task 文字帶入編輯的 input 並全選
function editInputAutoEmbed(e, targetId) {
  editInput = document.querySelector(`input[data-editInputId="${e.target.dataset.id}"]`)
  if (e.target.classList.contains('taskList__editBtn') && editInput) {
    data.forEach(item => {
      if (parseInt(targetId) === item['id']) {
        editInput.value = item['content']
      }
    })
    editInput.select()
  }
}

// 點擊 確定編輯 按鈕
function confirmEditBtnHandler(e, targetId) {
  currentTaskTextId = document.querySelector(`span[data-taskTextId="${e.target.dataset.id}"]`)
  if (e.target.classList.contains('taskList__confirmBtn') && currentTaskTextId) {
    data.forEach(item => {
      if (parseInt(targetId) === item['id']) {
        item['content'] = editInput.value
        currentTaskTextId.textContent = item['content']
      }
    })
    editInput.value = ''
    editBlock.classList.toggle('active')
    editMode = false
  }
}

// 若 editInput 存在、editMode 為 true，
// 則監聽 editInput 的 keyup 事件，否則移除監聽 editInput 的 keyup 事件
function editEnterHandler() {
  if (editInput && editMode) {
    editInput.addEventListener('keyup', editUseEnter, false)
  } else {
    editInput.removeEventListener('keyup', editUseEnter, false)
  }
}

// editInput 按 enter 確定編輯
function editUseEnter(e) {
  if (e.keyCode === 13) {
    data.forEach(item => {
      if (parseInt(editInput.dataset.id) === item['id']) {
        item['content'] = editInput.value
        currentTaskTextId.textContent = item['content']
      }
    })
    editInput.value = ''
    editBlock.classList.toggle('active')
    editMode = false
  }
}

// ----- check 完成代辦事項 -----
function taskStatusHandler(e) {
  if (!e.target.classList.contains('taskList__checkbox')) return
  checkInput = document.querySelector(`input[data-checkInputId="${e.target.dataset.id}"]`)
  changeTaskStatus()
  updateUncompletedTaskData()
  updateCompletedTaskData()
  rerenderHandler()
  changeTaskCount()
  taskTextCheckEffect()
}

// 原始全部資料 => 切換 isCompleted 狀態
function changeTaskStatus() {
  data.forEach(item => {
    if (parseInt(checkInput.dataset.id) === item.id) {
      if (checkInput.checked) item['isCompleted'] = true
      else item['isCompleted'] = false
    }
  })
}

// 更新未完成資料
function updateUncompletedTaskData() {
  uncompletedTaskData = data.filter(item => item['isCompleted'] === false)
}

// 更新已完成資料
function updateCompletedTaskData() {
  completedTaskData = data.filter(item => item['isCompleted'] === true)
}

// 更新篩選文字的計數 Count
function changeTaskCount() {
  filterAllCount.textContent = `(${data.length})`
  filterUncompletedCount.textContent = `(${uncompletedTaskData.length})`
  filterCompletedCount.textContent = `(${completedTaskData.length})`
}

// Check 後的文字效果
function taskTextCheckEffect() {
  let currentTaskText = document.querySelector(`span[data-taskTextId="${checkInput.dataset.id}"]`)

}

// ----- 篩選待辦事項 -----
function taskFilterHandler(e) {
  e.preventDefault()
  let target = e.target
  allTaskFilter(e)
  uncompletedTaskFilter(e)
  completedTaskFilter(e)
  filterSelectBlockHandler(target)
  filterTextColorChange(e)
  console.log(filterStatus)
}

// filterSelectBlock 效果
function filterSelectBlockHandler(target) {
  if (!target.closest('.filter')) return
  filterSelectBlock.style.width = `${target.closest('.filter').getBoundingClientRect().width}px`
  filterSelectBlock.style.height = `${target.closest('.filter').getBoundingClientRect().height}px`
  filterSelectBlock.style.left = `${target.closest('.filter').offsetLeft}px`
  filterSelectBlock.style.top = `${target.closest('.filter').offsetTop}px`
}

// 篩選文字顏色變換
function filterTextColorChange(e) {
  filters.forEach(item => {
    item.classList.remove('active')
  })
  e.target.closest('.filter .filter__changeStatus').classList.add('active')
}

// 點擊 全部 => 更新篩選狀態並重新渲染 data
function allTaskFilter(e) {
  if (e.target.classList.contains('filter__changeStatus-all') ||
    e.target.classList.contains('filter__allTaskCount')) {
    filterStatus = 'all'
    render(data)
  }
}

// 點擊 待完成 => 更新篩選狀態並重新渲染 uncompletedTaskData
function uncompletedTaskFilter(e) {
  if (e.target.classList.contains('filter__changeStatus-uncompleted') ||
    e.target.classList.contains('filter__uncompletedTaskCount')) {
    filterStatus = 'uncompleted'
    render(uncompletedTaskData)
  }
}

// 點擊完成 => 更新篩選狀態並重新渲染 completedTaskData
function completedTaskFilter(e) {
  if (e.target.classList.contains('filter__changeStatus-completed') ||
    e.target.classList.contains('filter__completedTaskCount')) {
    filterStatus = 'completed'
    render(completedTaskData)
  }
}

// 新增、刪除、check 待辦事項時 => 根據篩選狀態重新渲染
function rerenderHandler() {
  if (filterStatus === 'all') render(data)
  if (filterStatus === 'uncompleted') render(uncompletedTaskData)
  if (filterStatus === 'completed') render(completedTaskData)
}

// ----- 刪除待辦事項 -----
function deleteDoubleCheck(e) {
  if (!e.target.classList.contains('taskList__deleteBtn')) return
  let deleteDoubleCheck = confirm('確定刪除這一筆 ?')
  if (deleteDoubleCheck) deleteTask(e)
  else return
}

// 使用 target id 從原始資料找到目標 index => 刪除並根據篩選狀態重新渲染
function deleteTask(e) {
  let deleteTargetId = parseInt(e.target.dataset.id)
  let deleteIndex = data.findIndex(item => {
    return item['id'] === deleteTargetId
  })
  data.splice(deleteIndex, 1)
  updateUncompletedTaskData()
  updateCompletedTaskData()
  rerenderHandler()
  changeTaskCount()
}

// ----- 監聽 -----
addBtn.addEventListener('click', addTask, false)
taskInput.addEventListener('keyup', function (e) {
  if (e.keyCode === 13) addTask()
}, false)
statusFilter.addEventListener('click', taskFilterHandler, false)
taskList.addEventListener('click', editTaskHandler, false)
taskList.addEventListener('click', taskStatusHandler, false)
taskList.addEventListener('click', deleteDoubleCheck, false)